/// <reference path="/Users/jupdike/Documents/dev/nitpic/node_modules/@types/jquery/index.d.ts" />
/// <reference path="/Users/jupdike/Documents/dev/nitpic/node_modules/@types/react/index.d.ts" />

var MyCode = (function() {

function getField(desc, key, defaulty) {
  var ret = defaulty;
  // parse desc and grab g=c or g=n or g=e or g=w or g=s
  var ps = desc.split(":");
  if (ps && ps.length >= 1) {
    ps.forEach(function(ab) {
      var pair = ab.split("=");
      if (pair && pair.length == 2) {
        if (pair[0] === key) {
          ret = pair[1];
        }
      }
    })
  }
  return ret;
}

function makethumburl(fname, desc) {
  desc = desc || "g=c";
  var grav = getField(desc, "g", "c");
  return "/thumbs" + "/sq" + grav + "." + fname;
}

function ajaxGetHelper(url, success) {
  $.ajax({
    url: url,
    dataType: 'json',
    cache: false,
    success: success,
    error: function(xhr, status, err) {
      console.error(this.props.url, status, err.toString());
    }.bind(this)
  });
}

function ajaxPostHelper(url, data, success) {
  $.ajax({
    url: url,
    dataType: 'json',
    type: 'POST',
    data: data,
    success: success,
    error: function(xhr, status, err) {
      console.error(this.props.url, status, err.toString());
    }.bind(this)
  });
}

var Album = React.createClass({
  getInitialState: function() {
    return { data: { list: [], bykey: {} } };
  },
  componentDidMount: function() {
    ajaxGetHelper(this.props.url,
      (data) => {
        this.setState({data: data});
      });
  },
  render: function() {
    var picNodes = this.state.data.list.map(function (pic) {
      return (
        <Pic key={pic.fname}
             fname={pic.fname} desc={pic.desc} title={pic.title} />
      );
    });
    return (
      <div className="album" data={this.state.data}>
        {picNodes}
      </div>
    );
  }
});

var Pic: any = React.createClass({
  getInitialState: function() {
    return{ title: this.props.title,
            desc: this.props.desc,
            fname: this.props.fname
          }
  },
  handleCaptionDone: function(key, arg) {
    var newObj = null;
    if (key === 'title') {
      newObj = { title: arg, fname: this.state.fname, desc: this.state.desc };
    } else if (key === 'desc') {
      newObj = { title: this.state.title, fname: this.state.fname, desc: arg };
    }
    // send this to the Model (on the server)
    ajaxPostHelper('/api/pics', newObj,
      (data) => {
        //console.log("got back changed state from server");
        //console.log(data);
        this.setState(data);
      });
  },
  render: function() {
    return (
      <div className="pic">
        <img src={makethumburl(this.state.fname, this.state.desc)} />
        <Caption initValue={this.state.title} onDone={(arg) => this.handleCaptionDone('title', arg)} />
        <Caption initValue={this.state.desc} onDone={(arg) => this.handleCaptionDone('desc', arg)} />
      </div>
    );
  }
});

var Caption: any = React.createClass({
  getInitialState: function() {
    return { editing: false, val: this.props.initValue };
  },
  handleClick: function() {
    this.setState({editing: true});
  },
  handleTextChange: function(e) {
    this.setState({editing: true, val: e.target.value});
  },
  handleBlur: function(e) {
    this.setState({editing: false});
    this.props.onDone(e.target.value);
  },
  // prevent pressing enter when meaning to submit but default is to insert new line since textarea is multiline
  handleKeyDown: function(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      e.target.blur();
    }
  },
  render: function() {
    if (this.state.editing)
      return (
        <textarea
          rows={4}
          autoFocus
          onKeyDown={this.handleKeyDown}
          onBlur={this.handleBlur}
          placeholder="Type a caption"
          value={this.state.val}
          onChange={this.handleTextChange}
        />
      );
    else
      return (
        <div className="pic-cap" onClick={this.handleClick}>{this.state.val}</div>
      );
  }
});

return {
  Album: Album,
  ajaxGetHelper: ajaxGetHelper,
  makethumburl: makethumburl
};

})();
