/// <reference path="/Users/jupdike/Documents/dev/nitpic/node_modules/@types/jquery/index.d.ts" />
/// <reference path="/Users/jupdike/Documents/dev/nitpic/node_modules/@types/react/index.d.ts" />

import MyCode from './Shared'
import React = require("react");

export interface AlbumProps {
  url: string;
  hostRoot: string;
  thumbsUrlBase: string;
}
export interface AlbumState {
  data: any
}
export class EditAlbum extends React.Component<AlbumProps, AlbumState> {
  state: AlbumState = { data: { list: [], bykey: {} } }
  componentDidMount() {
    MyCode.ajaxGetHelper(this.props.hostRoot + this.props.url,
      (data) => {
        this.setState({data: data});
      });
  }
  render() {
    var picNodes = this.state.data.list.map((pic) => {
      return (
        <Pic key={pic.fname} thumbsUrlBase={this.props.thumbsUrlBase} hostRoot={this.props.hostRoot}
             fname={pic.fname} desc={pic.desc} title={pic.title} />
      );
    });
    return (
      <div className="album" data={this.state.data}>
        {picNodes}
      </div>
    );
  }
}

interface PicProps {
  hostRoot, thumbsUrlBase, title, desc, fname: string
}
interface PicState {
  desc, title, fname: string
}
class Pic extends React.Component<PicProps, PicState> {
  state: PicState;
  constructor(props: PicProps) {
    super(props);
    this.state = {
      title: this.props.title,
      desc: this.props.desc,
      fname: this.props.fname
    }
  }
  handleCaptionDone(key, arg) {
    var newObj = null;
    if (key === 'title') {
      newObj = { title: arg, fname: this.state.fname, desc: this.state.desc ? this.state.desc : "g=c" }; // don't write out  undefined -> 'undefined'
    } else if (key === 'desc') {
      newObj = { title: this.state.title ? this.state.title : "", fname: this.state.fname, desc: arg };
    }
    // send this to the Model (on the server)
    MyCode.ajaxPostHelper(this.props.hostRoot + 'api/pics', newObj,
      (data) => {
        this.setState(data);
      });
  }
  render() {
    return (
      <div className="pic">
        <img src={MyCode.makethumburl(this.props.hostRoot + this.props.thumbsUrlBase, this.state.fname, this.state.desc)} />
        <Caption initValue={this.state.title ? this.state.title : ""} onDone={(arg) => this.handleCaptionDone('title', arg)} />
        <Caption initValue={this.state.desc ? this.state.desc : "g=c"} onDone={(arg) => this.handleCaptionDone('desc', arg)} />
      </div>
    );
  }
}

interface CaptionProps {
  initValue: string
  onDone: any
}
interface CaptionState {
  editing: boolean
  val: string
}
class Caption extends React.Component<CaptionProps, CaptionState> {
  state: CaptionState
  constructor(props: CaptionProps) {
    super(props);
    this.state = { editing: false, val: this.props.initValue };
    this.handleClick = this.handleClick.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }
  handleClick() {
    this.setState({editing: true, val: this.state.val});
  }
  handleTextChange(e) {
    this.setState({editing: true, val: e.target.value});
  }
  handleBlur(e) {
    this.setState({editing: false, val: this.state.val});
    this.props.onDone(e.target.value);
  }
  // prevent pressing enter when meaning to submit but default is to insert new line since textarea is multiline
  handleKeyDown(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      e.target.blur();
    }
  }
  render() {
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
        <div className="pic-cap" onClick={this.handleClick}>{(this.state.val && this.state.val != '') ? this.state.val : "Click to edit"}</div>
      );
  }
}
