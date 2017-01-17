export default class Shared {

  public static getField(desc, key, defaulty) {
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
      });
    }
    return ret;
  }

  public static makethumburl(host, fname, desc) {
    desc = desc || "g=c";
    var grav = Shared.getField(desc, "g", "c");
    var f = "sq" + grav + "." + fname;
    // assumes host ends with /
    return host + f;
  }

  public static ajaxGetHelper(url, success) {
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

  public static ajaxPostHelper(url, data, success) {
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
}
