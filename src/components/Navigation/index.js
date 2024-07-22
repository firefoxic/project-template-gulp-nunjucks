/**
 * Activates navigation by setting up event listeners for toggling navigation state and handling escape key.
 *
 * @param {Element} navigation - the navigation element to activate
 * @returns {void}
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
		let isOpen = toggler.getAttribute(`aria-expanded`) === `false`

		toggler.setAttribute(`aria-expanded`, String(isOpen))

		window[`${isOpen ? `add` : `remove`}EventListener`](`keyup`, handleEscape)

		if (!isOpen && navigation.querySelector(`:focus`) !== null) toggler.focus()
	}

	/**
	 * Handle the Escape key event.
	 *
	 * @param {event} event - the event object
	 * @returns {void}
	 */
	function handleEscape (event) {
		if (event.code === `Escape`) {
			toggleState()
		}
	}
}
