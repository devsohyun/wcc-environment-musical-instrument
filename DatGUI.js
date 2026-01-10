class DatGUI {
  constructor(_params) {
    this.gui = new dat.GUI({ width: 300 });

    const folder = this.gui.addFolder('Instrument Control');

    folder.add(_params, 'basePitch', 0, 500, 1);
    folder.add(_params, 'pitchRange', 50, 1500, 10);

    folder.add(_params, 'fmAmount', 0, 10, 0.01);
    folder.add(_params, 'fmSpeed', 0, 1, 0.01);

    folder.add(_params, 'smoothness', 0, 2, 0.01);

    folder.open();
    this.hide();
  }

  hide() {
    this.gui.domElement.style.display = 'none';
  }

  toggle() {
    this.gui.domElement.style.display =
      this.gui.domElement.style.display === 'none' ? 'block' : 'none';
  }
}
