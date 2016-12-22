import MyCode from './mycode'
import React = require("react");
import TypedReact = require("typed-react");

var Gallery = (function() {
var makethumburl = MyCode.makethumburl;
var ajaxGetHelper = MyCode.ajaxGetHelper;
if (ajaxGetHelper) {
  //console.log("found ajaxGetHelper");
}

var baseUrl = 'https://dl.dropboxusercontent.com/u/143480/gallery/';

// create a reusable offscreen canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 4;
canvas.height = 4;

function make4x4ImgUrl(str) {
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

function make4x4BlackSquare(alpha) {
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

var blackSquare4x4Url = make4x4BlackSquare(48);

var PrettyCaption: any = React.createClass({
  render: function() {
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

});

var Thumb: any = React.createClass({
  getInitialState: function() {
    return{ title: this.props.title,
            desc: this.props.desc,
            fname: this.props.fname,
            hex4x4url: make4x4ImgUrl(this.props.hex4x4),
            thumburl: baseUrl + makethumburl(this.props.fname, this.props.desc).replace('/thumbs/', ''),
          }
  },
  handleClick: function(event) {
    //event.preventDefault();
    //var el = event.target;
    //console.log(el); // if actual thumbnail component / div needed
    this.props.onSetIndex(this.props.index);
  },
  render: function() {
    var styleBg = {
      backgroundImage: 'url("'+this.state.hex4x4url+'")',
      backgroundSize: "160px 160px",
      backgroundRepeat: "no-repeat",
    };
    var styleBlack = {
      backgroundImage: 'url("'+blackSquare4x4Url+'")',
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
});

var Big: any = React.createClass({
  getInitialState: function() {
    return {smallLoaded: this.props.smallLoaded};
  },
  handleLoaded: function(e) {
    if (this.state.smallLoaded) {
      return;
    }
    this.setState({smallLoaded: true});
  },
  render: function() {
    if (!this.props.data || this.props.data.index >= this.props.data.list.length) {
      return null;
    }
    var fname = this.props.data.list[this.props.data.index].fname;
    var bigImg = baseUrl + "/160." + fname;
    if (this.state.smallLoaded) {
      bigImg = baseUrl + "/1920." + fname;
    }
    var style = {
      backgroundImage: 'url("'+bigImg+'")',
      backgroundSize: "96vw 54vw",
      backgroundRepeat: "no-repeat",
    };
    return (
      <div className="big">
        <img className="full" src={bigImg} onLoad={this.handleLoaded} />
      </div>
    );
  }
});

var Thumbs = React.createClass({
  getInitialState: function() {
    return { data: { list: [], bykey: {}, index: 0, key: 0 } };
  },
  componentDidMount: function() {
    ajaxGetHelper(this.props.url,
      (data) => {
        this.setState({ data: data });
      });
  },
  handleSetIndex: function(index) {
    // modify 'key' every time we change the index so Big can re-render with new state (resets its smallLoaded to false)
    var data = {list: this.state.data.list, bykey: this.state.data.bykey, index: index,
      key: this.state.data.key + 1};
    this.setState({data: data});
  },
  // TODO Also change state data.index when user presses arrow keys or clicks navigation bits
  render: function() {
    var thumbNodes = this.state.data.list.map((pic) => {
      return (
        <Thumb key={pic.fname} hex4x4={pic.hex4x4} index={pic.index}
             fname={pic.fname} desc={pic.desc} title={pic.title} onSetIndex={this.handleSetIndex}/>
      );
    });
    return (
      <div className="album" data={this.state.data}>
        <Big key={this.state.data.key} data={this.state.data} smallLoaded={false} />
        {thumbNodes}
      </div>
    );
  }
});

return {
  Thumbs: Thumbs
};

})();
