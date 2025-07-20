export interface ProgressStage {
  message: string;
  percentage: number;
}

export interface ProgressConfig {
  [key: string]: ProgressStage;
}

export interface ProgressReportCallback {
  (stage: ProgressStage, stageName: string): void;
}

export class ProgressReporter {
  private readonly progressConfig: ProgressConfig;
  private readonly stageNames: string[];
  private currentStageIndex: number;
  private onProgressCallback?: ProgressReportCallback;

  constructor(config: ProgressConfig) {
    this.progressConfig = config;
    this.stageNames = Object.keys(config);
    this.currentStageIndex = 0;
  }

  /**
   * Set a callback function to be called when progress is reported
   */
  public onProgress(callback: ProgressReportCallback): void {
    this.onProgressCallback = callback;
  }

  /**
   * Report progress for a specific stage or the next stage if no stage is specified
   */
  public report(stageName?: string): void {
    const targetStageName = this.getTargetStageName(stageName);
    if (!targetStageName) {
      return;
    }

    const stage = this.progressConfig[targetStageName];
    if (!stage) {
      console.warn(`Progress stage '${targetStageName}' not found in configuration`);
      return;
    }

    this.updateCurrentStageIndex(targetStageName);
    this.executeProgressCallback(stage, targetStageName);
  }

  /**
   * Skip a specific stage or the current stage if no stage is specified
   */
  public skip(stageName?: string): void {
    const targetStageName = this.getTargetStageName(stageName);
    if (!targetStageName) {
      return;
    }

    this.updateCurrentStageIndex(targetStageName);
    
    // Move to next stage after skipping
    if (this.currentStageIndex < this.stageNames.length - 1) {
      this.currentStageIndex++;
    }
  }

  /**
   * Reset the progress reporter to the initial stage
   */
  public reset(): void {
    this.currentStageIndex = 0;
  }

  /**
   * Get the current stage information
   */
  public getCurrentStage(): { stage: ProgressStage; name: string } | null {
    if (this.currentStageIndex >= this.stageNames.length) {
      return null;
    }

    const currentStageName = this.stageNames[this.currentStageIndex];
    const currentStage = this.progressConfig[currentStageName];
    
    return {
      stage: currentStage,
      name: currentStageName
    };
  }

  /**
   * Check if all stages have been completed
   */
  public isComplete(): boolean {
    return this.currentStageIndex >= this.stageNames.length;
  }

  /**
   * Get all available stage names
   */
  public getStageNames(): string[] {
    return [...this.stageNames];
  }

  private getTargetStageName(stageName?: string): string | null {
    if (stageName) {
      return stageName;
    }

    if (this.currentStageIndex >= this.stageNames.length) {
      console.warn('No more stages available to report');
      return null;
    }

    return this.stageNames[this.currentStageIndex];
  }

  private updateCurrentStageIndex(stageName: string): void {
    const stageIndex = this.stageNames.indexOf(stageName);
    if (stageIndex !== -1) {
      this.currentStageIndex = stageIndex;
    }
  }

  private executeProgressCallback(stage: ProgressStage, stageName: string): void {
    if (this.onProgressCallback) {
      this.onProgressCallback(stage, stageName);
    }
  }
}