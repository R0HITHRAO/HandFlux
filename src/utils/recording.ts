export function captureCanvasScreenshot(threeCanvas: HTMLCanvasElement, hudCanvas: HTMLCanvasElement, filename: string = 'hand-fx-capture.png'): void {
  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = threeCanvas.width;
  compositeCanvas.height = threeCanvas.height;
  const ctx = compositeCanvas.getContext('2d');
  if (!ctx) return;

  // Draw 3D WebGL render
  ctx.drawImage(threeCanvas, 0, 0);
  // Draw 2D HUD overlays
  ctx.drawImage(hudCanvas, 0, 0);

  const dataUrl = compositeCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export class CanvasRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private animFrameId: number = 0;
  private compositeCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.compositeCanvas = document.createElement('canvas');
    this.ctx = this.compositeCanvas.getContext('2d')!;
  }

  public startRecording(threeCanvas: HTMLCanvasElement, hudCanvas: HTMLCanvasElement): void {
    this.compositeCanvas.width = threeCanvas.width;
    this.compositeCanvas.height = threeCanvas.height;
    this.recordedChunks = [];

    const drawFrame = () => {
      this.ctx.clearRect(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
      this.ctx.drawImage(threeCanvas, 0, 0);
      this.ctx.drawImage(hudCanvas, 0, 0);
      if (this.isRecording) {
        this.animFrameId = requestAnimationFrame(drawFrame);
      }
    };
    drawFrame();

    const stream = this.compositeCanvas.captureStream(60);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    this.mediaRecorder = new MediaRecorder(stream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hand-fx-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    this.mediaRecorder.start();
    this.isRecording = true;
  }

  public stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      cancelAnimationFrame(this.animFrameId);
    }
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}
