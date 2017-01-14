import React = require("react");
import TypedReact = require("typed-react");
import Shared from './Shared'

const baseUrl = Shared.HOST + '/thumbs';

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
    var title = this.props.title || "";
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
            thumburl: Shared.makethumburl(this.props.fname, this.props.desc) //.replace('/thumbs/', ''),
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

interface BigProps {
  data: DataInner;
  smallLoaded: boolean;
  visible: boolean;
}
interface BigState {
  smallLoaded: boolean;
  visible: boolean;
}
export class Big extends React.Component<BigProps, BigState> {
  state: BigState;
  constructor(props: BigProps) {
    super(props);
    this.state = { smallLoaded: this.props.smallLoaded, visible: this.props.visible }
    this.handleLoaded = this.handleLoaded.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
  }
  handleLoaded(e) {
    if (this.state.smallLoaded) {
      return;
    }
    this.setState({smallLoaded: true, visible: this.state.visible});
  }
  handleCloseClick(e) {
    this.setState({smallLoaded: this.state.smallLoaded, visible: false});
  }
  render() {
    if (!this.props.data || this.props.data.index >= this.props.data.list.length) {
      return null;
    }
    var info: ThumbProps = this.props.data.list[this.props.data.index];
    var fname = info.fname;
    var bigImg = baseUrl + "/160." + fname;
    if (this.state.smallLoaded) {
      bigImg = baseUrl + "/1920." + fname;
    }
    var style = {
      backgroundImage: 'url("'+bigImg+'")',
      backgroundSize: "96vw 54vw",
      backgroundRepeat: "no-repeat",
    };
    var sob = {
      display: this.state.visible ? "block" : "none"
    };
    var circleStyle = {
      fill: "#444444"
    }
    var pathStyle = {
      stroke: "#666666",
      fill: "#666666"
    }
    var title1 = "";
    var title2 = "";
    if (info.title.indexOf(": ")) {
      var ix = info.title.indexOf(": ");
      title1 = info.title.slice(ix + 2);
      title2 = info.title.slice(0, ix);
    } else {
      title1 = info.title;
    }
    return (
      <div className="big over" style={sob}>
        <div className="x" onClick={this.handleCloseClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width="6vw" height="6vw" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" style={circleStyle} />
            <path transform="translate(3,3),scale(0.75)" style={pathStyle} d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </div>
        <img className="full" src={bigImg} onLoad={this.handleLoaded} />
        <div className="below">
          <div className="topcap">{title1}</div>
          <div className="botcap">{title2}</div>
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
}
interface ThumbsState {
  visible: boolean;
  data: DataInner;
}
export class Thumbs extends React.Component<ThumbsProps, ThumbsState> {
  state: ThumbsState = { visible: false, data: { list: [], bykey: {}, index: 0, key: 0 } }
  constructor(props: ThumbsProps) {
    super(props);
    // this.state = { // use props if needed...
    // }
    this.handleSetIndex = this.handleSetIndex.bind(this); // such BS that this is necessary
  }
  componentDidMount() {
    Shared.ajaxGetHelper('/api/pics',  //this.props.url,    TODO also   url={url}
      (data) => {
        // console.log("got data");
        this.setState({ visible: this.state.visible, data: data });
        // console.log(this.state);
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
    var thumbNodes = this.state.data.list.map((pic) => {
      return (
        <Thumb key={pic.fname} hex4x4={pic.hex4x4} index={pic.index}
             fname={pic.fname} desc={pic.desc} title={pic.title} onSetIndex={this.handleSetIndex}/>
      );
    });
    // <div className="album" data={this.state.data}> ... </div>
    return (
      <div className="album">
        <Big visible={this.state.visible} key={this.state.data.key} data={this.state.data} smallLoaded={false} />
        {thumbNodes}
      </div>
    );
  }
}
