// Reo tracking. Mintlify loads every .js file in the repo on every page.
// Production only: skips `mintlify dev`, preview deployments, and laminarai.mintlify.dev.
if (window.location.hostname === "laminar.sh") {
  !function(){var e,t,n;e="64238dd8705b29d",t=function(){Reo.init({clientID:"64238dd8705b29d", enableThirdPartyTracking: true})},(n=document.createElement("script")).src="https://static.reo.dev/"+e+"/reo.js",n.defer=!0,n.onload=t,document.head.appendChild(n)}();
}
