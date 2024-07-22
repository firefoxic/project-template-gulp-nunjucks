import { activateNavigation } from "../components/Navigation/index.js"

let navigations = document.querySelectorAll(`.Navigation`)

navigations.forEach((navigation) => { activateNavigation(navigation) })
