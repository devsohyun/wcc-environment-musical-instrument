# Environment Musical Instrument

Goldsmiths Computational Arts Workshop for Creative Coding Term 1 final asssessment.

## Description

An in-depth paragraph about your project and overview of use.

## Getting Started

### Dependencies

This libraries are installed via cdn.

* [p5.sound](https://p5js.org/download/)
* [dat.gui](https://cdnjs.com/libraries/dat-gui)
* [p5.serialport](https://github.com/p5-serial/p5.serialport/tree/main)

### Installing

#### Download videos

Download source videos from [Dropbox](https://www.dropbox.com/scl/fo/zuq1la161k5uyq61q8f56/AOQcG_rdx9V7Uw6vTaStHcw?rlkey=7etboxxlygx1lvki6wkzvnfxq&st=cn13i5hc&dl=0). <br>
Then create directory and place the videos in it.
```
assets/video/
```

#### Arduino Serial

The project is set to not using Arduino data as default.<br> 
But if you have Arduino hardware connection, you need a nodejs server to communicate between p5js and arduino serial. To do this, follow as described below:
1. Set <code>this.isArduinoConnected = true</code> in AppManager.js
2. Download p5.serialport by cloning this [repository](https://github.com/p5-serial/p5.serialserver).
3. Install the dependencies with the command <code>npm install</code>.
4. Start the server with the command <code>node startserver.js</code>.

### Executing program

#### Keyboard inputs

Control the app by pressing keys below.

- n: Next video
- g: Gui panel open/close toggle

## Help

When you use Arduino and getting data through serial, make sure to close serial print console from IDE

## Acknowledgments

These are the links of projects that I got inspiration from.
- [Werner de Valk, Songs of Horizon](https://wernerdevalk.nl/songs-of-the-horizon/)
- [Alexander Chen, Mta.me](http://mta.me/)
- Thank you to Jiayun Song for inspriation and letting me use part of her code. See more details from Documentation.
