import { useEffect, useRef } from "react";
import { gfxMain, init } from "./gfx";

// We import the DNA sequence from a text file, the ?raw portion is used to load the file as a string
import sequence from "./dna.txt?raw";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Initialize WebGPU
    const initPromise = init(canvasRef.current!);

    gfxMain(initPromise, sequence);
  }, []);

  return <canvas width={800} height={800} ref={canvasRef}></canvas>;
}

export default App;
