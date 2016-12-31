export default class MyCode {

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

  public static makethumburl(fname, desc) {
    desc = desc || "g=c";
    var grav = MyCode.getField(desc, "g", "c");
    return MyCode.HOST + "/thumbs" + "/sq" + grav + "." + fname;
  }

  public static HOST = "http://localhost:3000"

  public static ajaxGetHelper(url, success) {
    $.ajax({
      url: MyCode.HOST + url,
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
      url: MyCode.HOST + url,
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
