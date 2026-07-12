class Options {
  mode: 'lotto' | 'normal' = 'lotto';
  drawCount: number = 6;
  useSkills: boolean = false;
  winningRank: number = 0;
  autoRecording: boolean = true;
}

const options = new Options();
export default options;
