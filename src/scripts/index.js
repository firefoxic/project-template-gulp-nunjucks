import { activateNavigation } from "../components/Navigation/index.js"

let navigations = document.querySelectorAll(`.Navigation`)

for (let navigation of navigations) activateNavigation(navigation)
