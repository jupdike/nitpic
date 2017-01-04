import * as React from "react";
import * as ReactDOM from "react-dom";

import { Album } from "./scripts/album";

/*
interface HelloProps {
  compiler: string; framework: string; }
// 'HelloProps' describes the shape of props.
// State is never set so we use the 'undefined' type.
class Hello extends React.Component<HelloProps, undefined> {
  render() {
    return <h1>Hello from {this.props.compiler} and {this.props.framework}!</h1>;
  }
}
*/

export class RenderClass {
  public static RenderEditAlbum(url, contentDivId) {
    ReactDOM.render(
      <Album url={url}/>,
      document.getElementById(contentDivId)
    );
  }
}
