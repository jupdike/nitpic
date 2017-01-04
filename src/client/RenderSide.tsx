import * as React from "react";
import * as ReactDOM from "react-dom";

import { Album } from "./scripts/Album";

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
  static polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }
  public static describeArc(x, y, radius, startAngle, endAngle) {
    var start = RenderClass.polarToCartesian(x, y, radius, endAngle);
    var end = RenderClass.polarToCartesian(x, y, radius, startAngle);
    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    var d = [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
    return d;
  }
  public static RenderEditAlbum(url, contentDivId) {
    ReactDOM.render(
      <Album url={url}/>,
      document.getElementById(contentDivId)
    );
  }
}
