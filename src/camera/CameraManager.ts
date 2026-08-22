export class CameraManager {
  private videoElement: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private isMirrored: boolean = true;
  private isReady: boolean = false;

  constructor() {
    this.videoElement = document.createElement('video');
    this.videoElement.setAttribute('autoplay', '');
    this.videoElement.setAttribute('muted', '');
    this.videoElement.setAttribute('playsinline', '');
    this.videoElement.style.display = 'none';
    document.body.appendChild(this.videoElement);
  }

  public async startCamera(targetWidth: number = 1280, targetHeight: number = 720): Promise<HTMLVideoElement> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API (getUserMedia) not supported in this environment');
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          width: { ideal: targetWidth },
          height: { ideal: targetHeight },
          facingMode: 'user',
          frameRate: { ideal: 60, min: 24 }
        }
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoElement) {
        this.videoElement.srcObject = this.mediaStream;
        await this.videoElement.play();
        this.isReady = true;
        return this.videoElement;
      }
      throw new Error('Video element failed to initialize');
    } catch (err: unknown) {
      // Fallback to basic constraints if high resolution failed
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (this.videoElement) {
          this.videoElement.srcObject = this.mediaStream;
          await this.videoElement.play();
          this.isReady = true;
          return this.videoElement;
        }
      } catch (fallbackErr) {
        throw new Error('Camera access denied or unavailable: ' + (err instanceof Error ? err.message : String(err)));
      }
      throw err;
    }
  }

  public stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.isReady = false;
  }

  public getVideo(): HTMLVideoElement | null {
    return this.videoElement;
  }

  public getIsReady(): boolean {
    return this.isReady && !!this.videoElement && this.videoElement.readyState >= 2;
  }

  public getVideoDimensions(): { width: number; height: number; aspect: number } {
    if (!this.videoElement || this.videoElement.videoWidth === 0) {
      return { width: 1280, height: 720, aspect: 16 / 9 };
    }
    return {
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight,
      aspect: this.videoElement.videoWidth / this.videoElement.videoHeight
    };
  }
}
