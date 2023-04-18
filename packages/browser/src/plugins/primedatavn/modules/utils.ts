//@ts-nocheck
/**
 * Add style css into the end of the head tag
 */
export const appendStyle = (cssString: string) => {
  let head = document.head || document.getElementsByTagName("head")[0],
    style: HTMLStyleElement = document.createElement("style");

  head.appendChild(style);

  style.type = "text/css";
  //@ts-ignore
  if (style.styleSheet) {
    // This is required for IE8 and below.
    //@ts-ignore
    style.styleSheet.cssText = cssString;
  } else {
    style.appendChild(document.createTextNode(cssString));
  }
}

/**
 * Load style css into head html tag
 * @param {string} path - link css you want to load into head tag
 * @param fn
 * @param scope
 * @returns {HTMLLinkElement}
 */
export const loadStyle = (path: string, fn?: () => void, scope?: any) => {
  let head = document.getElementsByTagName("head")[0];
  let link = document.createElement("link");
  link.setAttribute("href", path);
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("type", "text/css");

  var sheet: string, cssRules: string;

  if ("sheet" in link) {
    sheet = "sheet";
    cssRules = "cssRules";
  } else {
    sheet = "styleSheet";
    cssRules = "rules";
  }

  var interval_id = setInterval(function () {
      try {
        //@ts-ignore
        if (link[sheet] && link[sheet][cssRules].length) {
          clearInterval(interval_id);
          clearTimeout(timeout_id);
          //@ts-ignore
          fn && fn.call(scope || window, true, link);
        }
      } catch (e) {
      } finally {
      }
    }, 10),
    timeout_id = setTimeout(function () {
      clearInterval(interval_id);
      clearTimeout(timeout_id);
      head.removeChild(link);
      //@ts-ignore
      fn && fn.call(scope || window, false, link);
    }, 15000);

  head.appendChild(link);
  return link;
}


/**
 * Load script into head tag html
 * @param {string} src - Link script to load into head tag
 * @param cb
 */
export const loadScript = (src: string, cb: () => void) => {
  var newScript = document.createElement("script");
  newScript.type = "text/javascript";
  newScript.setAttribute("async", "true");
  newScript.setAttribute("src", src);

  //@ts-ignore
  if (newScript.readyState) {
    //@ts-ignore
    newScript.onreadystatechange = function () {
      //@ts-ignore
      if (cb && /loaded|complete/.test(newScript.readyState)) cb();
    };
  } else {
    cb && newScript.addEventListener("load", cb, false);
  }

  //@ts-ignore
  document.documentElement.firstChild.appendChild(newScript);
}

export const rgbStrToHex = (rgbStr: string) => {
  if (!rgbStr || rgbStr === "") return "";
  if (rgbStr.indexOf("(") < 0 && rgbStr.indexOf(")") < 0) return rgbStr;
  if (rgbStr === "transparent") return "0x00000000";
  var a = rgbStr.split("(")[1].split(")")[0];
  a = a.split(",");
  const b = a.map(function (x) {             //For each array element
    x = parseInt(x).toString(16);      //Convert to a base16 string
    return (x.length === 1) ? "0" + x : x;  //Add zero if we get only one character
  });
  b.splice(3, 1);
  return "#" + b.join("");
}
