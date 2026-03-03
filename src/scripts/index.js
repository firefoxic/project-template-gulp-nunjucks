import { activateNavigation } from "../components/Navigation/index.js"

let navigations = document.querySelectorAll(`.navigation`)

for (let navigation of navigations) activateNavigation(navigation)
