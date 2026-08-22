export class CameraManager {
  private videoElement: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private isReady: boolean = false;
  private isStarting: boolean = false;

  constructor() {
    this.createVideoElement();
  }

  private createVideoElement(): void {
    if (this.videoElement) return;
    this.videoElement = document.createElement('video');
    this.videoElement.setAttribute('autoplay', 'true');
    this.videoElement.setAttribute('muted', 'true');
    this.videoElement.setAttribute('playsinline', 'true');
    this.videoElement.muted = true;
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    
    this.videoElement.style.position = 'fixed';
    this.videoElement.style.top = '-9999px';
    this.videoElement.style.left = '-9999px';
    this.videoElement.style.width = '640px';
    this.videoElement.style.height = '360px';
    this.videoElement.style.opacity = '0';
    this.videoElement.style.pointerEvents = 'none';
    this.videoElement.style.zIndex = '-1';
    document.body.appendChild(this.videoElement);
  }

  public async startCamera(targetWidth: number = 1280, targetHeight: number = 720): Promise<HTMLVideoElement> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API (getUserMedia) not supported in this browser/device');
    }

    if (this.isReady && this.videoElement && this.videoElement.srcObject) {
      return this.videoElement;
    }

    if (this.isStarting) {
      await new Promise(r => setTimeout(r, 200));
      if (this.videoElement) return this.videoElement;
    }

    this.isStarting = true;

    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
        this.mediaStream = null;
      }

      this.createVideoElement();
      const video = this.videoElement!;

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          width: { ideal: targetWidth, min: 480 },
          height: { ideal: targetHeight, min: 270 },
          facingMode: 'user'
        }
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      this.mediaStream = stream;
      video.srcObject = stream;

      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) {
          resolve();
        } else {
          video.onloadedmetadata = () => resolve();
          setTimeout(resolve, 800);
        }
      });

      try {
        await video.play();
      } catch (playErr: any) {
        if (playErr.name === 'AbortError' || String(playErr).includes('interrupted')) {
          console.warn('Camera play() interrupted by lifecycle; ignoring AbortError.');
        } else {
          throw playErr;
        }
      }

      this.isReady = true;
      this.isStarting = false;
      return video;
    } catch (err: unknown) {
      this.isStarting = false;
      this.isReady = false;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('interrupted') || msg.includes('AbortError')) {
        if (this.videoElement) return this.videoElement;
      }
      throw new Error('Camera access error: ' + msg);
    }
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
    this.isStarting = false;
  }

  public getVideo(): HTMLVideoElement | null {
    return this.videoElement;
  }

  public getIsReady(): boolean {
    return this.isReady && !!this.videoElement && this.videoElement.readyState >= 2 && this.videoElement.videoWidth > 0;
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
