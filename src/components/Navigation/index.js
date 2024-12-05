/**
 * Activates navigation by setting up event listeners for toggling navigation state and handling escape key.
 *
 * @param {Element} navigation - the navigation element to activate
 * @returns {void}
 *
 * @example
 * import { activateNavigation } from "./Navigation.js"
 *
 * const navigation = document.querySelector(".Navigation")
 * activateNavigation(navigation)
 */
export function activateNavigation (navigation) {
	let toggler = navigation.querySelector(`[aria-controls]`)

	toggler.setAttribute(`aria-expanded`, false)
	toggler.removeAttribute(`hidden`)

	toggler.addEventListener(`click`, toggleState)

	/**
	 * Toggles the state of the element and handles key events.
	 *
	 * @returns {void}
	 */
	function toggleState () {
		let isOpen = toggler.getAttribute(`aria-expanded`) === `true`
		let newState = !isOpen

		toggler.setAttribute(`aria-expanded`, String(newState))

		window[`${newState ? `add` : `remove`}EventListener`](`keyup`, handleEscape)
		window[`${newState ? `add` : `remove`}EventListener`](`click`, handleOuterClick)

		if (!newState && navigation.querySelector(`:focus`) !== null) toggler.focus()
	}

	/**
	 * Handles the Escape key event.
	 *
	 * If the Escape key is pressed, toggle the state of the navigation.
	 *
	 * @param {event} event - the event object
	 * @returns {void}
	 */
	function handleEscape (event) {
		if (event.code === `Escape`) toggleState()
	}

	/**
	 * Handle the outer click event.
	 *
	 * If the click target is not inside the navigation, toggle the state.
	 *
	 * @param {event} event - the event object
	 * @returns {void}
	 */
	function handleOuterClick (event) {
		if (!navigation.contains(event.target)) toggleState()
	}
}
