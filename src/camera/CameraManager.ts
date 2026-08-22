export class CameraManager {
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isReady: boolean = false;

  public async attachToVideo(video: HTMLVideoElement, targetWidth: number = 1280, targetHeight: number = 720): Promise<MediaStream> {
    this.videoElement = video;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam API (getUserMedia) not supported in this browser');
    }

    if (this.mediaStream && this.mediaStream.active) {
      video.srcObject = this.mediaStream;
      await video.play().catch(() => {});
      this.isReady = true;
      return this.mediaStream;
    }

    this.stopCamera();

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: targetWidth, min: 640 },
        height: { ideal: targetHeight, min: 360 },
        frameRate: { ideal: 30 }
      }
    };

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.warn('Fallback to basic constraints:', err);
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    this.mediaStream = stream;
    video.srcObject = stream;

    await new Promise<void>((resolve) => {
      if (video.readyState >= 2) {
        resolve();
      } else {
        video.onloadeddata = () => resolve();
        setTimeout(resolve, 1000);
      }
    });

    try {
      await video.play();
    } catch (playErr: any) {
      if (playErr.name !== 'AbortError') throw playErr;
    }

    this.isReady = true;
    console.log('[CameraManager] Camera active:', video.videoWidth, 'x', video.videoHeight);
    return stream;
  }

  public stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isReady = false;
  }

  public getIsReady(): boolean {
    return this.isReady && !!this.videoElement && this.videoElement.readyState >= 2 && !this.videoElement.paused;
  }

  public getVideo(): HTMLVideoElement | null {
    return this.videoElement;
  }
}
