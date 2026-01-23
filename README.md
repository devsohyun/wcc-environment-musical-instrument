# Sonic Soundscape

P5.js project exploring sonic sounds in different environments. This project was developed during Workshop for Creative Coding module within the MA Computational Arts programme at Goldsmiths University of London.

## Description

This project explores how environmental video data can be translated into sound to reveal the often-overlooked sonic relationships between human, non-human, and urban environments through interactive audiovisual synthesis.

Watch project video at [Vimeo](https://vimeo.com/1153339333?fl=pl&fe=sh)

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
But if you have Arduino hardware connection, you need to run the nodejs server to communicate between p5js and arduino serial. To do this, follow as described below:
1. Set <code>this.isArduinoConnected = true</code> in AppManager.js
2. Go to node server directory in your terminal <code>cd server/</code>
3. Install the dependencies with the command <code>npm install</code>.
4. Start the server with the command <code>node startserver.js</code>.

The server code is from [p5-serial](https://github.com/p5-serial/p5.serialserver).

### Executing program

#### Keyboard inputs

Control the app by pressing keys below.

- n: Next video
- g: Gui panel open/close toggle

## Installation



## Help

When you use Arduino and getting data through serial, make sure to close serial print console from IDE.

### Known Issues

If you connect Arduino, sometimes turning potentiometers too fast will cause a crash. In this case, refresh the browser.

## Acknowledgments

These are the links of projects that I got inspiration from.
- [Werner de Valk, Songs of Horizon](https://wernerdevalk.nl/songs-of-the-horizon/)
- [Alexander Chen, Mta.me](http://mta.me/)
- Thank you to Jiayun Song for inspriation and letting me use part of her code. See more details from Documentation.
