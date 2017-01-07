import * as React from "react";
import * as ReactDOM from "react-dom";

import { EditAlbum } from "./scripts/Album";
import { Thumbs } from "./scripts/Gallery";

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
  public static RenderGalleryAlbum(url, contentDivId) {
    ReactDOM.render(
      <Thumbs/>,
      document.getElementById(contentDivId)
    );
  }
  public static RenderEditAlbum(url, key, contentDivId) {
    console.log("call RenderEditAlbum");
    //document.getElementById(contentDivId).innerHTML = "";
    ReactDOM.render(
      <EditAlbum key={key} url={url}/>,
      document.getElementById(contentDivId)
    );
  }
}
