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
  public static FirstTimeRender() {
    ReactDOM.render(
      //<Hello compiler="TypeScript" framework="React" />,
      //React.createElement(Album, { url: "/api/pics" }),
      <Album url="/api/pics"/>,
      document.getElementById('content')
    );
  }
}
