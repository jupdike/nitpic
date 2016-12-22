/// <reference path="/Users/jupdike/Documents/dev/nitpic/node_modules/@types/jquery/index.d.ts" />
/// <reference path="/Users/jupdike/Documents/dev/nitpic/node_modules/@types/react/index.d.ts" />

import MyCode from './mycode'
import React = require("react");
import TypedReact = require("typed-react");

var Album = React.createClass({
  getInitialState: function() {
    return { data: { list: [], bykey: {} } };
  },
  componentDidMount: function() {
    MyCode.ajaxGetHelper(this.props.url,
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
    MyCode.ajaxPostHelper('/api/pics', newObj,
      (data) => {
        //console.log("got back changed state from server");
        //console.log(data);
        this.setState(data);
      });
  },
  render: function() {
    return (
      <div className="pic">
        <img src={MyCode.makethumburl(this.state.fname, this.state.desc)} />
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
