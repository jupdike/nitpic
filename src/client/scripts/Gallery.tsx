import React = require("react");
import TypedReact = require("typed-react");
import Shared from './Shared'

// create a reusable offscreen canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 4;
canvas.height = 4;

class Gallery {
  static make4x4ImgUrl(str) {
    var imgData = ctx.getImageData(0,0,4,4);
    var data = imgData.data;
    // convert 24 bit
    for(var i = 0; i < data.length; i += 4){
      var offset = ((i|0) / 4)|0;
      offset *= 6
      data[i+0] = parseInt(str.slice(offset+0, offset+2), 16);
      data[i+1] = parseInt(str.slice(offset+2, offset+4), 16);
      data[i+2] = parseInt(str.slice(offset+4, offset+6), 16);
      data[i+3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    // TODO could resample using custom kernel, deconvolve and make what appears to be a guassian blurred image
    // as a 160x160 image

    return canvas.toDataURL();
  }

  static make4x4BlackSquare(alpha) {
    var imgData = ctx.getImageData(0,0,4,4);
    var data = imgData.data;
    // convert 24 bit
    for(var i = 0; i < data.length; i += 4){
      var offset = ((i|0) / 4)|0;
      offset *= 6
      data[i+0] = 0;
      data[i+1] = 0;
      data[i+2] = 0;
      data[i+3] = alpha;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  }

  static blackSquare4x4Url = Gallery.make4x4BlackSquare(48);
}

interface PrettyCapProps {
  title: string;
}
class PrettyCaption extends React.Component<PrettyCapProps, undefined> {
  render() {
    var title = this.props.title || "(click to view full image)";
    if (title.indexOf(":") > -1) {
      // TWO+ PIECES (use two of them)
      var t1 = this.props.title.split(":")[0];
      var t2 = this.props.title.split(":")[1];
      // top
      var rhsTop = "100%";
      if (t2.length < 10) {
        rhsTop = "125%";
      }
      else if (t2.length < 12) {
        rhsTop = "110%";
      }
      else if (t2.length > 20) {
        rhsTop = "80%";
      }
      else if (t2.length > 14) {
        rhsTop = "90%";
      }
      // bottom
      var rhsBottom = "68%";
      if (t1.length < 10) {
        rhsBottom = "90%";
      }
      else if (t1.length < 12) {
        rhsBottom = "80%";
      }
      else if (t1.length > 25) {
        rhsBottom = "49%";
      }
      else if (t1.length > 23) {
        rhsBottom = "52%";
      }
      else if (t1.length > 20) {
        rhsBottom = "55%";
      }
      else if (t1.length > 14) {
        rhsBottom = "58%";
      }

      var styleTop = { "fontSize": rhsTop };
      var styleBottom = { "fontSize": rhsBottom };
      return (
        <span>
          <div className="caption-top" style={styleTop}>{t2}</div>
          <div className="caption-bottom" style={styleBottom}>{t1}</div>
        </span>
      );
    }
    return (
      <div className="caption-top">{title}</div>
    );
  }
}

interface ThumbProps {
  title, desc, fname, hex4x4: string;
  onSetIndex: any;
  index: number;
  hostRoot: string;
}
interface ThumbState {
  title, desc, fname, hex4x4url, thumburl: string;
}
class Thumb extends React.Component<ThumbProps, ThumbState> {
  state: ThumbState;
  constructor(props: ThumbProps) {
    super(props);
    this.state =
          { title: this.props.title,
            desc: this.props.desc,
            fname: this.props.fname,
            hex4x4url: Gallery.make4x4ImgUrl(this.props.hex4x4),
            thumburl: Shared.makethumburl(this.props.hostRoot, this.props.fname, this.props.desc)
          }
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick(event) {
    //event.preventDefault();
    //var el = event.target;
    //console.log(el); // if actual thumbnail component / div needed
    this.props.onSetIndex(this.props.index);
  }
  render() {
    var styleBg = {
      backgroundImage: 'url("'+this.state.hex4x4url+'")',
      backgroundSize: "160px 160px",
      backgroundRepeat: "no-repeat",
    };
    var styleBlack = {
      backgroundImage: 'url("'+Gallery.blackSquare4x4Url+'")',
      backgroundSize: "160px 160px",
      backgroundRepeat: "no-repeat",
      width: "160px",
      height: "160px",
    };
    var styleImg = {
      width: "160px",
      height: "160px",
    }
    return (
      <div className="thumb"
        style={styleBg}
        onClick={this.handleClick}>
        <div className="black" style={styleBlack}>
          <PrettyCaption title={this.state.title} />
        </div>
        <img src={this.state.thumburl} style={styleImg} />
      </div>
    );
  }
}

var circleStyle = {
  fill: "#444444"
}
var pathStyle = {
  stroke: "#666666",
  fill: "#666666"
}
var pathStyle2 = {
  stroke: "#555555",
  fill: "#555555"
}
var playSvg = <svg xmlns="http://www.w3.org/2000/svg" className="svg-button" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" style={circleStyle} />
                <path transform="translate(1.8, 1.8),scale(0.85)" style={pathStyle2} d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
var pauseSvg = <svg xmlns="http://www.w3.org/2000/svg" className="svg-button" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" style={circleStyle} />
                <path transform="translate(1.8, 1.8),scale(0.85)" style={pathStyle2} d="M9 16h2V8H9v8zm3-14C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-4h2V8h-2v8z"/>
              </svg>
var xsvg =    <svg xmlns="http://www.w3.org/2000/svg" className="svg-button" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" style={circleStyle} />
                <path transform="translate(3,3),scale(0.75)" style={pathStyle} d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
var prevsvg = <svg xmlns="http://www.w3.org/2000/svg" className="svg-button" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" style={circleStyle} />
                <path transform="translate(1.8, 1.8),scale(0.85)" style={pathStyle} d="M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"/>
              </svg>
var nextsvg = <svg xmlns="http://www.w3.org/2000/svg" className="svg-button" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" style={circleStyle} />
                <path transform="translate(1.8, 1.8),scale(0.85)" style={pathStyle} d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/>
              </svg>

interface BigProps {
  smallLoaded: boolean;
  visible: boolean;
  data: DataInner;
  hostRoot: string; // assume hostRoot ends with /
}
interface BigState {
  smallLoaded: boolean;
  visible: boolean;
  data: DataInner;
  playing: boolean;
}
// arrow keys left and right, space to toggle play/pause, escape to close
export class Big extends React.Component<BigProps, BigState> {
  state: BigState;
  constructor(props: BigProps) {
    super(props);
    this.state = { smallLoaded: this.props.smallLoaded, visible: this.props.visible, data: this.props.data,
      playing: false };
    this.handleLoaded = this.handleLoaded.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handlePrevClick = this.handlePrevClick.bind(this);
    this.handleNextClick = this.handleNextClick.bind(this);
    this.handlePlayPauseClick = this.handlePlayPauseClick.bind(this);

    $(document).bind('keyup', (e) => {
      if (!this.state.visible) {
        return; // don't do anything unless this Big component is visible
      }
      console.log('pressed '+e.which);
      if (e.which == 37) { // left arrow 
        e.preventDefault();
        this.handlePrevClick(null);
      }
      else if (e.which == 39) { // right arrow
        e.preventDefault();
        this.handleNextClick(null);
      }
      else if (e.which == 32) { // space bar
        e.preventDefault();
        this.handlePlayPauseClick(null);
      }
      else if (e.which == 27) { // escape key
        e.preventDefault();
        this.handleCloseClick(null);
      }
    });

  }
  handleLoaded(e) {
    if (this.state.smallLoaded) {
      return;
    }
    this.setState({smallLoaded: true, visible: this.state.visible, data: this.state.data, playing: this.state.playing});
  }
  handlePlayPauseClick(e) {
    console.log('playing', this.state.playing);

    console.log('set state');
    var newPlaying = true;
    if (this.state.playing) {
      newPlaying = false;
    }
    this.setState({smallLoaded: this.state.smallLoaded, visible: this.state.visible, data: this.state.data, playing: newPlaying});
    
    console.log('playing', newPlaying);
    this.addOneNextClick(newPlaying);
  }
  addOneNextClick(newPlaying) {
    if (newPlaying) {
      console.log('set timeout');
      window.setTimeout(() => {
        if (this.state.playing) {
          console.log('clicking next for you!');
          this.handleNextClick(null);
          this.addOneNextClick(this.state.playing);
        }
      }, 3000);
    }
  }
  handleCloseClick(e) {
    this.setState({smallLoaded: this.state.smallLoaded, visible: false, data: this.state.data, playing: false});
  }
  handlePrevClick(e) {
    var newIndex = this.state.data.index - 1;
    if (newIndex < 0) {
      newIndex = this.state.data.list.length - 1;
    }
    this.setState({smallLoaded: false, visible: this.state.visible, playing: false,
      data: { list: this.state.data.list, bykey: this.state.data.bykey, index: newIndex, key: this.state.data.key } });
  }
  handleNextClick(e) {
    var newIndex = this.state.data.index + 1;
    if (newIndex > this.state.data.list.length - 1) {
      newIndex = 0;
    }
    this.setState({smallLoaded: false, visible: this.state.visible, playing: this.state.playing,
      data: { list: this.state.data.list, bykey: this.state.data.bykey, index: newIndex, key: this.state.data.key } });
    console.log('playing', this.state.playing);
  }
  render() {
    if (!this.state.data || this.state.data.index >= this.state.data.list.length) {
      return null;
    }
    var info: ThumbProps = this.state.data.list[this.state.data.index];
    var fname = info.fname;
    var bigImg = this.props.hostRoot + "160." + fname;
    if (this.state.smallLoaded) {
      bigImg = this.props.hostRoot + "1920." + fname;
    }
    var style = {
      backgroundImage: 'url("'+bigImg+'")',
      backgroundSize: "96vw 54vw",
      backgroundRepeat: "no-repeat",
    };
    var sob = {
      display: this.state.visible ? "block" : "none"
    };
    var title1 = "";
    var title2 = "";
    if (info.title) {
      if (info.title.indexOf(": ") > -1) {
        var ix = info.title.indexOf(": ");
        title1 = info.title.slice(ix + 2);
        title2 = info.title.slice(0, ix);
      } else {
        title1 = info.title;
      }
    }
    return (
      <div className="over">
        <div className="big" style={sob}>
          <img className="full" src={bigImg} onLoad={this.handleLoaded} />
          <div className="below">
          
            <div className="flex-item targets x" onClick={this.handleCloseClick}>
              {xsvg}
            </div>

            <div className="flex-item caps">
              <div className="topcap">{title1}</div>
              <div className="botcap">{title2}</div>
            </div>

            <div className="flex-item">
              <div className="targets prev" onClick={this.handlePrevClick}>
                {prevsvg}
              </div>
              <div className="targets playpause" onClick={this.handlePlayPauseClick}>
                {this.state.playing ? pauseSvg : playSvg}
              </div>
              <div className="targets next" onClick={this.handleNextClick}>
                {nextsvg}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
}

interface DataInner {
  list: Array<any>;
  bykey: any;
  index: number;
  key: number;
}
interface ThumbsProps {
   hostRoot, jsonFile: string;
}
interface ThumbsState {
  visible: boolean;
  data: DataInner;
}
export class Thumbs extends React.Component<ThumbsProps, ThumbsState> {
  state: ThumbsState = { visible: false, data: { list: [], bykey: {}, index: 0, key: 0 } }
  constructor(props: ThumbsProps) {
    super(props);
    this.handleSetIndex = this.handleSetIndex.bind(this); // such BS that this is necessary
  }
  componentDidMount() {
    Shared.ajaxGetHelper(this.props.hostRoot + this.props.jsonFile,
      (data) => {
        this.setState({ visible: this.state.visible, data: data });
      });
  }
  handleSetIndex(index) {
    // modify 'key' every time we change the index so Big can re-render with new state (resets its smallLoaded to false)
    var data = {list: this.state.data.list, bykey: this.state.data.bykey, index: index,
      key: this.state.data.key + 1};
    // make visible when a thing gets clicked
    this.setState({visible: true, data: data});
  }
  render() {
    var thumbNodes = this.state.data.list.map((pic) =>
        <Thumb hostRoot={this.props.hostRoot} key={pic.fname} hex4x4={pic.hex4x4} index={pic.index}
    fname={pic.fname} desc={pic.desc} title={pic.title} onSetIndex={this.handleSetIndex}/> );
    // <div className="album" data={this.state.data}> ... </div>
    return (
      <div className="album">
        <Big hostRoot={this.props.hostRoot} visible={this.state.visible} key={this.state.data.key} data={this.state.data} smallLoaded={false} />
        <div className="thumbs">{thumbNodes}</div>
      </div>
    );
  }
}
