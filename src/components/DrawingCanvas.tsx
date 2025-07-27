// DrawingCanvas.tsx
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import {
  Canvas,
  Path,
  Skia,
  SkPath,
  useCanvasRef,
} from '@shopify/react-native-skia';
import {
  PanGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define external functions that can be called from the parent
export type DrawingCanvasHandle = {
  clearCanvas: () => void;
  saveToStorage: () => void;
  saveAsImage: () => void;
  undoLast: () => void;
};

// Type to save path data as strings
type SerializablePath = string;

// Key used for saving to local storage
const STORAGE_KEY = 'DRAWING_PATHS';

// Props accepted by DrawingCanvas
type Props = {
  liveStroke?: boolean; // Whether to show stroke while drawing
};

const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(({ liveStroke = false }, ref) => {
  const [paths, setPaths] = useState<SkPath[]>([]); // List of completed paths
  const currentPath = useSharedValue<SkPath | null>(null); // Path currently being drawn
  const [showLive, setShowLive] = useState<SkPath | null>(null); // Live preview path
  const canvasRef = useCanvasRef();

  // Add completed path to state
  const addPath = (path: SkPath) => {
    setPaths((prev) => [...prev, path]);
  };

  // Load saved paths from AsyncStorage on mount
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data: SerializablePath[] = JSON.parse(stored);
          const loadedPaths = data.map(pathStr => Skia.Path.MakeFromSVGString(pathStr)!);
          setPaths(loadedPaths);
        }
      } catch (e) {
        console.warn('Failed to load saved drawing', e);
      }
    };
    loadFromStorage();
  }, []);

  // Gesture handler for drawing lines
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (event) => {
      const path = Skia.Path.Make();
      path.moveTo(event.x, event.y);
      currentPath.value = path;
      if (liveStroke) runOnJS(setShowLive)(path);
    },
    onActive: (event) => {
      if (currentPath.value) {
        currentPath.value.lineTo(event.x, event.y);
        if (liveStroke) runOnJS(setShowLive)(currentPath.value.copy());
      }
    },
    onEnd: () => {
      if (currentPath.value) {
        runOnJS(addPath)(currentPath.value.copy());
        currentPath.value = null;
        if (liveStroke) runOnJS(setShowLive)(null);
      }
    },
  });

  // Provide functions to parent component
  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      setPaths([]);
      AsyncStorage.removeItem(STORAGE_KEY);
    },
    saveToStorage: async () => {
      try {
        const serialized: SerializablePath[] = paths.map(p => p.toSVGString());
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
        Alert.alert('Drawing saved!');
      } catch (e) {
        Alert.alert('Failed to save drawing.');
      }
    },
    saveAsImage: async () => {
      try {
        const image = await canvasRef.current?.makeImageSnapshot();
        if (!image) return Alert.alert('Could not create image snapshot');

        const imagePath = FileSystem.documentDirectory + 'drawing.png';
        await FileSystem.writeAsStringAsync(imagePath, image.encodeToBase64(), {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          return Alert.alert('Permission denied');
        }

        await MediaLibrary.saveToLibraryAsync(imagePath);
        Alert.alert('Image saved to gallery!');
      } catch (e) {
        Alert.alert('Failed to export image.');
      }
    },
    undoLast: () => {
      setPaths((prev) => prev.slice(0, -1));
    },
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={{ flex: 1 }}>
        <Canvas ref={canvasRef} style={{ flex: 1, backgroundColor: 'white' }}>
          {paths.map((path, index) => (
            <Path
              key={index}
              path={path}
              color="black"
              style="stroke"
              strokeWidth={4}
            />
          ))}
          {liveStroke && showLive && (
            <Path
              path={showLive}
              color="black"
              style="stroke"
              strokeWidth={4}
            />
          )}
        </Canvas>
      </Animated.View>
    </PanGestureHandler>
  );
});

export default DrawingCanvas;
