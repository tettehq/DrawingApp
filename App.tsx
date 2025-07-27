// App.tsx
import React, { useRef } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DrawingCanvas, { DrawingCanvasHandle } from './src/components/DrawingCanvas';

export default function App() {
  // Create a reference to access DrawingCanvas methods
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  return (
    // Wrap the app with gesture handler root view
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>

        {/* Buttons at the top of the screen */}
        <View style={styles.buttons}>
          <Button
            title="Undo"
            onPress={() => canvasRef.current?.undoLast()} // Call undoLast method
          />
          <Button
            title="Clear"
            onPress={() => canvasRef.current?.clearCanvas()} // Clear the canvas
          />
          <Button
            title="Save"
            onPress={() => canvasRef.current?.saveToStorage()} // Save to local storage
          />
          <Button
            title="Export"
            onPress={() => canvasRef.current?.saveAsImage()} // Save image to file/gallery
          />
        </View>

        {/* Drawing canvas appears below the buttons */}
        <DrawingCanvas ref={canvasRef} liveStroke={true} />
      </View>
    </GestureHandlerRootView>
  );
}

// Styles for layout and appearance
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttons: {
    flexDirection: 'row', // Layout buttons in a row
    marginTop: 30, // Space from top
    justifyContent: 'space-around', // Evenly space buttons
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f8f8', // Light background
    elevation: 4, // Android shadow
    zIndex: 10, // Ensure it's above the canvas
  },
});
