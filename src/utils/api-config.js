const { hostname, pathname } = window && window.location;
var arr = hostname.split(".");
const subDomain = arr[0];
var url = "";
if (arr[1] === "herokuapp") {
  // topdomain = "backendherokuapp.com" https://devsinc-pos-backend.herokuapp.com
  // url = hostname+topdomain https://stormy-ocean-79147.herokuapp.com
  url = "https://stormy-ocean-79147.herokuapp.com";
} else if (
  (arr.length === 3 && arr[1] + "." + arr[2] === "lvh.me") ||
  (arr.length === 2 && arr[0] + "." + arr[1] === "lvh.me")
) {
  url = "http://" + hostname + ":3000";
}

export const apiUrl = url;
export const apiSubDomain = subDomain;
export const pathName = pathname;
