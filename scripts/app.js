const uiGlobals = {}
const { html, svg, render: renderElem } = uhtml;
uiGlobals.connectionErrorNotification = []
//Checks for internet connection status
if (!navigator.onLine)
    uiGlobals.connectionErrorNotification.push(notify('There seems to be a problem connecting to the internet, Please check you internet connection.', 'error'))
window.addEventListener('offline', () => {
    uiGlobals.connectionErrorNotification.push(notify('There seems to be a problem connecting to the internet, Please check you internet connection.', 'error'))
})
window.addEventListener('online', () => {
    uiGlobals.connectionErrorNotification.forEach(notification => {
        getRef('notification_drawer').remove(notification)
    })
    notify('We are back online.', 'success')
})

// Use instead of document.getElementById
function getRef(elementId) {
    return document.getElementById(elementId);
}
// displays a popup for asking permission. Use this instead of JS confirm
/**
@param {string} title - Title of the popup
@param {object} options - Options for the popup 
@param {string} options.message - Message to be displayed in the popup
@param {string} options.cancelText - Text for the cancel button
@param {string} options.confirmText - Text for the confirm button
@param {boolean} options.danger - If true, confirm button will be red
*/
const getConfirmation = (title, options = {}) => {
    return new Promise(resolve => {
        const { message = '', cancelText = 'Cancel', confirmText = 'OK', danger = false } = options
        getRef('confirm_title').innerText = title;
        getRef('confirm_message').innerText = message;
        const cancelButton = getRef('confirmation_popup').querySelector('.cancel-button');
        const confirmButton = getRef('confirmation_popup').querySelector('.confirm-button')
        confirmButton.textContent = confirmText
        cancelButton.textContent = cancelText
        if (danger)
            confirmButton.classList.add('button--danger')
        else
            confirmButton.classList.remove('button--danger')
        const { opened, closed } = openPopup('confirmation_popup')
        confirmButton.onclick = () => {
            closePopup({ payload: true })
        }
        cancelButton.onclick = () => {
            closePopup()
        }
        closed.then((payload) => {
            confirmButton.onclick = null
            cancelButton.onclick = null
            if (payload)
                resolve(true)
            else
                resolve(false)
        })
    })
}
// Use when a function needs to be executed after user finishes changes
const debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback.apply(null, args);
        }, wait);
    };
}
// adds a class to all elements in an array
function addClass(elements, className) {
    elements.forEach((element) => {
        document.querySelector(element).classList.add(className);
    });
}
// removes a class from all elements in an array
function removeClass(elements, className) {
    elements.forEach((element) => {
        document.querySelector(element).classList.remove(className);
    });
}
// return querySelectorAll elements as an array
function getAllElements(selector) {
    return Array.from(document.querySelectorAll(selector));
}

let zIndex = 50
// function required for popups or modals to appear
function openPopup(popupId, pinned) {
    if (popupStack.peek() === undefined) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePopup()
            }
        })
    }
    zIndex++
    getRef(popupId).setAttribute('style', `z-index: ${zIndex}`)
    return getRef(popupId).show({ pinned })
}


// hides the popup or modal
function closePopup(options = {}) {
    if (popupStack.peek() === undefined)
        return;
    popupStack.peek().popup.hide(options)
}

document.addEventListener('popupopened', async e => {
    //pushes popup as septate entry in history
    history.pushState({ type: 'popup' }, null, null)
    switch (e.target.id) {
        case '':
            break;
    }
})

document.addEventListener('popupclosed', e => {
    zIndex--;
    switch (e.target.id) {
        case 'task_popup':
            delete getRef('task_popup').dataset.taskId;
            break;
    }
    if (popupStack.peek() === undefined) {
        // if there are no more popups, do something
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePopup()
            }
        })
    }
})
window.addEventListener('popstate', e => {
    if (!e.state) return
    switch (e.state.type) {
        case 'popup':
            closePopup()
            break;
    }
})
//Function for displaying toast notifications. pass in error for mode param if you want to show an error.
function notify(message, mode, options = {}) {
    let icon
    switch (mode) {
        case 'success':
            icon = `<svg class="icon icon--success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"/></svg>`
            break;
        case 'error':
            icon = `<svg class="icon icon--error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/></svg>`
            options.pinned = true
            break;
    }
    if (mode === 'error') {
        console.error(message)
    }
    return getRef("notification_drawer").push(message, { icon, ...options });
}

function getFormattedTime(timestamp, format) {
    try {
        if (String(timestamp).length < 13)
            timestamp *= 1000
        let [day, month, date, year] = new Date(timestamp).toString().split(' '),
            minutes = new Date(timestamp).getMinutes(),
            hours = new Date(timestamp).getHours(),
            currentTime = new Date().toString().split(' ')

        minutes = minutes < 10 ? `0${minutes}` : minutes
        let finalHours = ``;
        if (hours > 12)
            finalHours = `${hours - 12}:${minutes}`
        else if (hours === 0)
            finalHours = `12:${minutes}`
        else
            finalHours = `${hours}:${minutes}`

        finalHours = hours >= 12 ? `${finalHours} PM` : `${finalHours} AM`
        switch (format) {
            case 'date-only':
                return `${month} ${date}, ${year}`;
                break;
            case 'time-only':
                return finalHours;
            default:
                return `${month} ${date} ${year}, ${finalHours}`;
        }
    } catch (e) {
        console.error(e);
        return timestamp;
    }
}
// detect browser version
function detectBrowser() {
    let ua = navigator.userAgent,
        tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE ' + (tem[1] || '');
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
    return M.join(' ');
}
function createRipple(event, target) {
    const circle = document.createElement("span");
    const diameter = Math.max(target.clientWidth, target.clientHeight);
    const radius = diameter / 2;
    const targetDimensions = target.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - (targetDimensions.left + radius)}px`;
    circle.style.top = `${event.clientY - (targetDimensions.top + radius)}px`;
    circle.classList.add("ripple");
    const rippleAnimation = circle.animate(
        [
            {
                opacity: 1,
                transform: `scale(0)`
            },
            {
                transform: "scale(4)",
                opacity: 0,
            },
        ],
        {
            duration: 600,
            fill: "forwards",
            easing: "ease-out",
        }
    );
    target.append(circle);
    rippleAnimation.onfinish = () => {
        circle.remove();
    };
}

class Router {
    /**
     * @constructor {object} options - options for the router
     * @param {object} options.routes - routes for the router
     * @param {object} options.state - initial state for the router
     * @param {function} options.routingStart - function to be called before routing
     * @param {function} options.routingEnd - function to be called after routing
     */
    constructor(options = {}) {
        const { routes = {}, state = {}, routingStart, routingEnd } = options
        this.routes = routes
        this.state = state
        this.routingStart = routingStart
        this.routingEnd = routingEnd
        this.lastPage = null
        window.addEventListener('hashchange', e => this.routeTo(window.location.hash))
    }
    /**
     * @param {string} route - route to be added
     * @param {function} callback - function to be called when route is matched
     */
    addRoute(route, callback) {
        this.routes[route] = callback
    }
    /**
     * @param {string} route
     */
    handleRouting = async (page) => {
        if (this.routingStart) {
            this.routingStart(this.state)
        }
        if (this.routes[page]) {
            await this.routes[page](this.state)
            this.lastPage = page
        } else {
            if (this.routes['404']) {
                this.routes['404'](this.state);
            } else {
                console.error(`No route found for '${page}' and no '404' route is defined.`);
            }
        }
        if (this.routingEnd) {
            this.routingEnd(this.state)
        }
    }
    async routeTo(destination) {
        try {
            let page
            let wildcards = []
            let params = {}
            let [path, queryString] = destination.split('?');
            if (path.includes('#'))
                path = path.split('#')[1];
            if (path.includes('/'))
                [, page, ...wildcards] = path.split('/')
            else
                page = path
            this.state = { page, wildcards, lastPage: this.lastPage, params }
            if (queryString) {
                params = new URLSearchParams(queryString)
                this.state.params = Object.fromEntries(params)
            }
            if (document.startViewTransition) {
                document.startViewTransition(async () => {
                    await this.handleRouting(page)
                })
            } else {
                // Fallback for browsers that don't support View transition API:
                await this.handleRouting(page)
            }
        } catch (e) {
            console.error(e)
        }
    }
}
// class based lazy loading
class LazyLoader {
    constructor(container, elementsToRender, renderFn, options = {}) {
        const { batchSize = 10, freshRender, bottomFirst = false, domUpdated } = options

        this.elementsToRender = elementsToRender
        this.arrayOfElements = (typeof elementsToRender === 'function') ? this.elementsToRender() : elementsToRender || []
        this.renderFn = renderFn
        this.intersectionObserver

        this.batchSize = batchSize
        this.freshRender = freshRender
        this.domUpdated = domUpdated
        this.bottomFirst = bottomFirst

        this.shouldLazyLoad = false
        this.lastScrollTop = 0
        this.lastScrollHeight = 0

        this.lazyContainer = document.querySelector(container)

        this.update = this.update.bind(this)
        this.render = this.render.bind(this)
        this.init = this.init.bind(this)
        this.clear = this.clear.bind(this)
    }
    get elements() {
        return this.arrayOfElements
    }
    init() {
        this.intersectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    observer.disconnect()
                    this.render({ lazyLoad: true })
                }
            })
        })
        this.mutationObserver = new MutationObserver(mutationList => {
            mutationList.forEach(mutation => {
                if (mutation.type === 'childList') {
                    if (mutation.addedNodes.length) {
                        if (this.bottomFirst) {
                            if (this.lazyContainer.firstElementChild)
                                this.intersectionObserver.observe(this.lazyContainer.firstElementChild)
                        } else {
                            if (this.lazyContainer.lastElementChild)
                                this.intersectionObserver.observe(this.lazyContainer.lastElementChild)
                        }
                    }
                }
            })
        })
        this.mutationObserver.observe(this.lazyContainer, {
            childList: true,
        })
        this.render()
    }
    update(elementsToRender) {
        this.arrayOfElements = (typeof elementsToRender === 'function') ? this.elementsToRender() : elementsToRender || []
    }
    render(options = {}) {
        let { lazyLoad = false } = options
        this.shouldLazyLoad = lazyLoad
        const frag = document.createDocumentFragment();
        if (lazyLoad) {
            if (this.bottomFirst) {
                this.updateEndIndex = this.updateStartIndex
                this.updateStartIndex = this.updateEndIndex - this.batchSize
            } else {
                this.updateStartIndex = this.updateEndIndex
                this.updateEndIndex = this.updateEndIndex + this.batchSize
            }
        } else {
            this.intersectionObserver.disconnect()
            if (this.bottomFirst) {
                this.updateEndIndex = this.arrayOfElements.length
                this.updateStartIndex = this.updateEndIndex - this.batchSize - 1
            } else {
                this.updateStartIndex = 0
                this.updateEndIndex = this.batchSize
            }
            this.lazyContainer.innerHTML = ``;
        }
        this.lastScrollHeight = this.lazyContainer.scrollHeight
        this.lastScrollTop = this.lazyContainer.scrollTop
        this.arrayOfElements.slice(this.updateStartIndex, this.updateEndIndex).forEach((element, index) => {
            frag.append(this.renderFn(element))
        })
        if (this.bottomFirst) {
            this.lazyContainer.prepend(frag)
            // scroll anchoring for reverse scrolling
            this.lastScrollTop += this.lazyContainer.scrollHeight - this.lastScrollHeight
            this.lazyContainer.scrollTo({ top: this.lastScrollTop })
            this.lastScrollHeight = this.lazyContainer.scrollHeight
        } else {
            this.lazyContainer.append(frag)
        }
        if (!lazyLoad && this.bottomFirst) {
            this.lazyContainer.scrollTop = this.lazyContainer.scrollHeight
        }
        // Callback to be called if elements are updated or rendered for first time
        if (!lazyLoad && this.freshRender)
            this.freshRender()
    }
    clear() {
        this.intersectionObserver.disconnect()
        this.mutationObserver.disconnect()
        this.lazyContainer.innerHTML = ``;
    }
    reset() {
        this.arrayOfElements = (typeof this.elementsToRender === 'function') ? this.elementsToRender() : this.elementsToRender || []
        this.render()
    }
}

function buttonLoader(id, show) {
    const button = typeof id === 'string' ? document.getElementById(id) : id;
    if (!button) return
    if (!button.dataset.hasOwnProperty('wasDisabled'))
        button.dataset.wasDisabled = button.disabled
    const animOptions = {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
    }
    if (show) {
        button.disabled = true
        button.parentNode.append(document.createElement('sm-spinner'))
        button.animate([
            {
                clipPath: 'circle(100%)',
            },
            {
                clipPath: 'circle(0)',
            },
        ], animOptions)
    } else {
        button.disabled = button.dataset.wasDisabled === 'true';
        button.animate([
            {
                clipPath: 'circle(0)',
            },
            {
                clipPath: 'circle(100%)',
            },
        ], animOptions).onfinish = (e) => {
            button.removeAttribute('data-original-state')
        }
        const potentialTarget = button.parentNode.querySelector('sm-spinner')
        if (potentialTarget) potentialTarget.remove();
    }
}

let isMobileView = false
const mobileQuery = window.matchMedia('(max-width: 40rem)')
function handleMobileChange(e) {
    isMobileView = e.matches
}
mobileQuery.addEventListener('change', handleMobileChange)

handleMobileChange(mobileQuery)
const slideInLeft = [
    {
        opacity: 0,
        transform: 'translateX(1.5rem)'
    },
    {
        opacity: 1,
        transform: 'translateX(0)'
    }
]
const slideOutLeft = [
    {
        opacity: 1,
        transform: 'translateX(0)'
    },
    {
        opacity: 0,
        transform: 'translateX(-1.5rem)'
    },
]
const slideInRight = [
    {
        opacity: 0,
        transform: 'translateX(-1.5rem)'
    },
    {
        opacity: 1,
        transform: 'translateX(0)'
    }
]
const slideOutRight = [
    {
        opacity: 1,
        transform: 'translateX(0)'
    },
    {
        opacity: 0,
        transform: 'translateX(1.5rem)'
    },
]
const slideInDown = [
    {
        opacity: 0,
        transform: 'translateY(-1.5rem)'
    },
    {
        opacity: 1,
        transform: 'translateY(0)'
    },
]
const slideOutUp = [
    {
        opacity: 1,
        transform: 'translateY(0)'
    },
    {
        opacity: 0,
        transform: 'translateY(-1.5rem)'
    },
]
window.smCompConfig = {
    'sm-input': [
        {
            selector: '[data-flo-address]',
            customValidation: (value) => {
                if (!value) return { isValid: false, errorText: 'Please enter a FLO address' }
                return {
                    isValid: floCrypto.validateFloID(value),
                    errorText: `Invalid FLO address.<br> It usually starts with "F"`
                }
            }
        },
        {
            selector: '[data-btc-address]',
            customValidation: (value) => {
                if (!value) return { isValid: false, errorText: 'Please enter a BTC address' }
                return {
                    isValid: btcOperator.validateAddress(value),
                    errorText: `Invalid address.<br> It usually starts with "1", "3" or "bc1"`
                }
            }
        },
        {
            selector: '[data-private-key]',
            customValidation: (value, inputElem) => {
                if (!value) return { isValid: false, errorText: 'Please enter a private key' }
                if (floCrypto.getPubKeyHex(value)) {
                    const forAddress = inputElem.dataset.forAddress
                    if (!forAddress) return { isValid: true }
                    return {
                        isValid: btcOperator.verifyKey(forAddress, value),
                        errorText: `This private key does not match the address ${forAddress}`
                    }
                } else
                    return {
                        isValid: false,
                        errorText: `Invalid private key. Please check and try again.`
                    }
            }
        }
    ]
}

async function applyToTask(id) {
    const confirmation = await getConfirmation('Apply to task', { message: 'Are you sure you want to apply to this task?' })
    if (!confirmation) return
    // apply to task
    floCloudAPI.sendGeneralData({ taskID: id }, 'taskApplications')
        .then(response => {
            notify('You have successfully applied to the task', 'success')
            render.availableTasks('available_tasks');
        }).catch(e => {
            notify('An error occurred while applying to the task', 'error')
        })
}

function editTask(id) {
    const task = floGlobals.appObjects.rmInterns.tasks.find(task => task.id === id);
    if (!task) return notify('Task not found', 'error')
    const { title, description, category, deadline } = task;
    getRef('task_popup__title_input').value = title;
    getRef('task_popup__description').value = description;
    getRef('task_popup__category').value = category;
    getRef('task_popup__deadline').value = deadline;
    getRef('task_popup').dataset.taskId = id;
    openPopup('task_popup')
}
async function saveTask() {
    const confirmation = await getConfirmation('Save task', {
        message: 'Are you sure you want to save this task?',
        confirmText: 'Save'
    })
    if (!confirmation) return;
    // save task
    const id = getRef('task_popup').dataset.taskId || Math.random().toString(36).substr(2, 9);
    const title = getRef('task_popup__title_input').value;
    const description = getRef('task_popup__description').value;
    const category = getRef('task_popup__category').value;
    const deadline = getRef('task_popup__deadline').value;
    const task = {
        id,
        title,
        description,
        category,
        deadline,
        status: 'open'
    }
    const foundTask = floGlobals.appObjects.rmInterns.tasks.find(task => task.id === id);
    if (foundTask) {
        let taskDetailsChanged = false;
        // edit task only if something has changed
        for (const key in task) {
            if (task[key] !== foundTask[key]) {
                taskDetailsChanged = true;
                foundTask[key] = task[key];
            }
        }
        if (!taskDetailsChanged)
            return notify('Please update at least one detail to save the changes', 'error')
    } else {
        task.date = Date.now();
        floGlobals.appObjects.rmInterns.tasks.unshift(task)
    }
    floCloudAPI.updateObjectData('rmInterns')
        .then(response => {
            notify('Task saved successfully', 'success')
            render.availableTasks('available_tasks_list');
        })
        .catch(e => {
            notify('An error occurred while saving the task', 'error')
            console.error(e)
        }).finally(() => {
            closePopup()
        })
}
async function deleteTask(id) {
    const confirmation = await getConfirmation('Delete task', {
        message: 'Are you sure you want to delete this task?',
        confirmText: 'Delete',
        danger: true
    })
    if (!confirmation) return;
    console
    const taskIndex = floGlobals.appObjects.rmInterns.tasks.findIndex(task => task.id === id);
    if (taskIndex < 0) return notify('Task not found', 'error');
    // in case of error, add the task back to the list
    const [cloneOfTaskToBeDeleted] = floGlobals.appObjects.rmInterns.tasks.splice(taskIndex, 1);
    floCloudAPI.updateObjectData('rmInterns')
        .then(response => {
            notify('Task deleted successfully', 'success')
        })
        .catch(e => {
            notify('An error occurred while deleting the task', 'error');
            // add the task back to the list
            floGlobals.appObjects.rmInterns.tasks.splice(taskIndex, 0, cloneOfTaskToBeDeleted);
        }).finally(() => {
            closePopup()
            render.availableTasks('available_tasks_list');
        })
}
const render = {
    task(details = {}) {
        const { title, description, date, id, status, deadline, category } = details;
        let actions = ''
        if (floGlobals.isSubAdmin) {
            actions = html`
                <button class="button button--outlined" onclick=${() => editTask(id)}>Edit</button>
                <button class="button button--outlined" onclick=${() => deleteTask(id)}>Delete</button>
            `
        } else if (!floGlobals.isAdmin) {
            // actions = html`
            //     <button class=${`button ${applied ? '' : 'button--outlined'}`} data-task-id=${id} onclick=${() => applyToTask(id)} ?disabled=${applied}>${applied ? 'Applied' : 'Apply'}</button>
            // `
        }
        return html`
            <li class="task-card" .dataset=${{ id }}>
                <h4>${title}</h4>
                <sl-relative-time date=${date}></sl-relative-time>
                <p>${description}</p>
                <ul class="flex gap-0-5 flex-wrap">
                    <li>${floGlobals.taskCategories[category]}</li>
                    ${deadline ? html`<li>Complete <sl-relative-time date=${deadline}></sl-relative-time></li>` : ''}
                </ul>
                <div class="flex justify-end gap-0-3">
                    ${actions}
                </div>
            </li>
        `
    },
    availableTasks(target) {
        if (floGlobals.appObjects?.rmInterns?.tasks?.length === 0)
            return renderElem(getRef(target), html`<p>No tasks available</p>`)
        const tasksList = floGlobals.appObjects.rmInterns.tasks.map(render.task);
        renderElem(getRef(target), html`${tasksList}`)
    }
}

// routing logic
const router = new Router({
    routingStart(state) {
        if ("scrollRestoration" in history) {
            history.scrollRestoration = "manual";
        }
        window.scrollTo(0, 0);
    },
    routingEnd(state) {
        const { page, lastPage } = state
        if (lastPage !== page) {
            closePopup()
        }
    }
})
const header = (page) => {
    const isUserLoggedIn = page === 'loading' || floGlobals.isUserLoggedIn
    return html`
        <header id="main_header" class="flex align-center gap-1">
            <a href="#/">
                <svg id="main_logo" class="icon" viewBox="0 0 27.25 32"> <title>RanchiMall</title> <path d="M27.14,30.86c-.74-2.48-3-4.36-8.25-6.94a20,20,0,0,1-4.2-2.49,6,6,0,0,1-1.25-1.67,4,4,0,0,1,0-2.26c.37-1.08.79-1.57,3.89-4.55a11.66,11.66,0,0,0,3.34-4.67,6.54,6.54,0,0,0,.05-2.82C20,3.6,18.58,2,16.16.49c-.89-.56-1.29-.64-1.3-.24a3,3,0,0,1-.3.72l-.3.55L13.42.94C13,.62,12.4.26,12.19.15c-.4-.2-.73-.18-.72.05a9.39,9.39,0,0,1-.61,1.33s-.14,0-.27-.13C8.76.09,8-.27,8,.23A11.73,11.73,0,0,1,6.76,2.6C4.81,5.87,2.83,7.49.77,7.49c-.89,0-.88,0-.61,1,.22.85.33.92,1.09.69A5.29,5.29,0,0,0,3,8.33c.23-.17.45-.29.49-.26a2,2,0,0,1,.22.63A1.31,1.31,0,0,0,4,9.34a5.62,5.62,0,0,0,2.27-.87L7,8l.13.55c.19.74.32.82,1,.65a7.06,7.06,0,0,0,3.46-2.47l.6-.71-.06.64c-.17,1.63-1.3,3.42-3.39,5.42L6.73,14c-3.21,3.06-3,5.59.6,8a46.77,46.77,0,0,0,4.6,2.41c.28.13,1,.52,1.59.87,3.31,2,4.95,3.92,4.95,5.93a2.49,2.49,0,0,0,.07.77h0c.09.09,0,.1.9-.14a2.61,2.61,0,0,0,.83-.32,3.69,3.69,0,0,0-.55-1.83A11.14,11.14,0,0,0,17,26.81a35.7,35.7,0,0,0-5.1-2.91C9.37,22.64,8.38,22,7.52,21.17a3.53,3.53,0,0,1-1.18-2.48c0-1.38.71-2.58,2.5-4.23,2.84-2.6,3.92-3.91,4.67-5.65a3.64,3.64,0,0,0,.42-2A3.37,3.37,0,0,0,13.61,5l-.32-.74.29-.48c.17-.27.37-.63.46-.8l.15-.3.44.64a5.92,5.92,0,0,1,1,2.81,5.86,5.86,0,0,1-.42,1.94c0,.12-.12.3-.15.4a9.49,9.49,0,0,1-.67,1.1,28,28,0,0,1-4,4.29C8.62,15.49,8.05,16.44,8,17.78a3.28,3.28,0,0,0,1.11,2.76c.95,1,2.07,1.74,5.25,3.32,3.64,1.82,5.22,2.9,6.41,4.38A4.78,4.78,0,0,1,21.94,31a3.21,3.21,0,0,0,.14.92,1.06,1.06,0,0,0,.43-.05l.83-.22.46-.12-.06-.46c-.21-1.53-1.62-3.25-3.94-4.8a37.57,37.57,0,0,0-5.22-2.82A13.36,13.36,0,0,1,11,21.19a3.36,3.36,0,0,1-.8-4.19c.41-.85.83-1.31,3.77-4.15,2.39-2.31,3.43-4.13,3.43-6a5.85,5.85,0,0,0-2.08-4.29c-.23-.21-.44-.43-.65-.65A2.5,2.5,0,0,1,15.27.69a10.6,10.6,0,0,1,2.91,2.78A4.16,4.16,0,0,1,19,6.16a4.91,4.91,0,0,1-.87,3c-.71,1.22-1.26,1.82-4.27,4.67a9.47,9.47,0,0,0-2.07,2.6,2.76,2.76,0,0,0-.33,1.54,2.76,2.76,0,0,0,.29,1.47c.57,1.21,2.23,2.55,4.65,3.73a32.41,32.41,0,0,1,5.82,3.24c2.16,1.6,3.2,3.16,3.2,4.8a1.94,1.94,0,0,0,.09.76,4.54,4.54,0,0,0,1.66-.4C27.29,31.42,27.29,31.37,27.14,30.86ZM6.1,7h0a3.77,3.77,0,0,1-1.46.45L4,7.51l.68-.83a25.09,25.09,0,0,0,3-4.82A12,12,0,0,1,8.28.76c.11-.12.77.32,1.53,1l.63.58-.57.84A10.34,10.34,0,0,1,6.1,7Zm5.71-1.78A9.77,9.77,0,0,1,9.24,7.18h0a5.25,5.25,0,0,1-1.17.28l-.58,0,.65-.78a21.29,21.29,0,0,0,2.1-3.12c.22-.41.42-.76.44-.79s.5.43.9,1.24L12,5ZM13.41,3a2.84,2.84,0,0,1-.45.64,11,11,0,0,1-.9-.91l-.84-.9.19-.45c.34-.79.39-.8,1-.31A9.4,9.4,0,0,1,13.8,2.33q-.18.34-.39.69Z"></path> </svg>
            </a>
            <theme-toggle class="margin-left-auto"></theme-toggle>
            ${isUserLoggedIn ? html`` : html`
                <div class="flex gap-0-5">
                    <a class="button button--outlined" href="#/sign_up">Get Started</a>
                    <a class="button button--primary" href="#/sign_in">Sign in</a>
                </div>
            `}
        </header>
    `
}
router.addRoute('loading', (state) => {
    renderElem(getRef('app_body'), html`
        <article id="loading">
            ${header('loading')}
            <section class="grid justify-content-center">
                <sm-spinner></sm-spinner>
                <div class="grid gap-1 justify-items-center">
                    <h4>Loading RanchiMall Internships</h4>
                    <button class="button button--colored" onclick=${signOut}>Reset</button>
                </div>
            </section>
        </article>
    `);
})
function renderLanding(state) {
    const { page } = state;
    renderElem(getRef('app_body'), html`
        <article id="landing">
            ${header(page)}
            <section class="flex flex-wrap">
                <div>
                    <h1 class="grid">
                        <span>
                            Internships
                        </span>
                        <span>
                            @ RanchiMall
                        </span>
                    </h1>
                    <svg id="emblem" width="77" height="77" viewBox="0 0 77 77" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="38.4806" cy="29.7768" r="29.1831"/> <circle cx="38.4806" cy="47.2232" r="29.1831"/> <circle cx="47.2038" cy="38.5" r="29.1831" transform="rotate(90 47.2038 38.5)"/> <circle cx="29.7574" cy="38.5" r="29.1831" transform="rotate(90 29.7574 38.5)"/> </svg>
                </div>
                <div class="flex flex-direction-column gap-1-5">
                    <h4>Available</h4>
                    <ul id="available_tasks_list" class="grid"></ul>
                </div>
            </section>
        </article>
    `)
    render.availableTasks('available_tasks_list')
}
router.addRoute('', renderLanding)
router.addRoute('landing', renderLanding)

function handleSignIn() {
    privKeyResolver(getRef('private_key_field').value.trim());
    router.routeTo('loading');
}
router.addRoute('sign_in', (state) => {
    const { } = state;
    let dataset = {}
    if (!floGlobals.isPrivKeySecured)
        dataset.privateKey = ''
    renderElem(getRef('app_body'), html`
        <article id="sign_in">
            ${header()}
            <section>
                <h1 style="font-size: 2rem;">Sign in</h1>
                <p>Welcome back, glad to see you again</p>
                <sm-form id="sign_in_form">
                    <sm-input id="private_key_field" class="password-field" type="password" .dataset=${dataset}
                        placeholder=${`${floGlobals.isPrivKeySecured ? 'Password' : 'FLO/BTC private key'}`} error-text="Private key is invalid" required>
                        <label slot="right" class="interact">
                            <input type="checkbox" class="hidden" autocomplete="off" readonly
                                onchange="togglePrivateKeyVisibility(this)">
                            <svg class="icon invisible" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"> <title>Hide password</title> <path d="M0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0z" fill="none" /> <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" /> </svg>
                            <svg class="icon visible" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"> <title>Show password</title> <path d="M0 0h24v24H0z" fill="none" /> <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /> </svg>
                        </label>
                    </sm-input>
                    <button id="sign_in_button" onclick="handleSignIn()" class="button button--primary" type="submit" disabled>Sign in</button>
                </sm-form>
                <p>
                    New here? <a href="#/sign_up">get your FLO login credentials</a>
                </p>
            </section>
        </article>
    `);
    getRef('private_key_field').focusIn();
})
function handleSignUp() {
    const privKey = getRef('generated_private_key').value.trim();
    privKeyResolver(privKey);
    router.routeTo('loading');
}
router.addRoute('sign_up', (state) => {
    const { floID, privKey } = floCrypto.generateNewID()
    renderElem(getRef('app_body'), html`
        <article id="sign_up">
            ${header()}
            <section class="grid gap-1-5">
                <div id="flo_id_warning" class="flex gap-1">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"> <path d="M0 0h24v24H0z" fill="none" /> <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /> </svg>
                    <div class="grid gap-0-5">
                        <strong>
                            <h3> Keep your keys safe! </h3>
                        </strong>
                        <p>Don't share with anyone. Once lost private key can't be recovered.</p>
                    </div>
                </div>
                <div class="grid gap-1-5 generated-keys-wrapper">
                    <div class="grid gap-0-5">
                        <h5>FLO address</h5>
                        <sm-copy id="generated_flo_address" value=${floID}></sm-copy>
                    </div>
                    <div class="grid gap-0-5">
                        <h5>Private key</h5>
                        <sm-copy id="generated_private_key" value=${privKey}></sm-copy>
                    </div>
                </div>
                <button id="sign_up_button" onclick="handleSignUp()" class="button button--primary w-100">Sign in with these credentials</button>
                <p class="margin-top-1">You can use these FLO credentials with other RanchiMall apps too. </p>
            </section>
        </article>
    `);
})

function handleSubAdminViewChange(e) {
    location.hash = `#/home?view=${e.target.value}`
}

router.addRoute('home', (state) => {
    const { params: { view = 'tasks' } = {} } = state;
    if (floGlobals.isAdmin) {

    } else if (floGlobals.isSubAdmin) {
        renderElem(getRef('app_body'), html`
            <article id="home">
                ${header()}
                <section class="grid gap-1">
                    <sm-chips class="margin-right-auto" onchange=${handleSubAdminViewChange}>
                        <sm-chip value="tasks" ?selected=${view === 'tasks'}>Tasks</sm-chip>
                        <sm-chip value="applications" ?selected=${view === 'applications'}>Applications</sm-chip>
                    </sm-chips>
                    <ul id="sub_admin_view" class="grid gap-1"></ul>
                </section>
            </article>
        `)
        if (view === 'tasks') {
            getRef('task_popup__title').textContent = 'Add Task';
            renderElem(getRef('sub_admin_view'), html`
                <div class="flex align-center space-between">
                    <h5>Active</h5>
                    <button class="button button--primary margin-left-auto gap-0-5" onclick=${() => openPopup('task_popup')}>
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        Add Task
                    </button>
                </div>
                <ul id="available_tasks_list" class="grid"></ul>
            `)
            render.availableTasks('available_tasks_list')
        } else if (view === 'applications') {
            renderElem(getRef('sub_admin_view'), html`
                <li class="flex align-center gap-1">
                    <h4>Applications</h4>
                    <sm-spinner></sm-spinner>
                </li>
            `)
        }
    } else {
        renderElem(getRef('app_body'), html`
            <article id="home">
                ${header()}
                <section class="grid gap-1">
                    <h2>Home</h2>
                    <div class="flex flex-direction-column gap-1-5">
                        <h4>Available</h4>
                        <ul id="available_tasks_list" class="grid"></ul>
                    </div>
                </section>
            </article>
        `)
        render.availableTasks('available_tasks_list')
    }
})

router.addRoute('profile', (state) => {
    renderElem(getRef('app_body'), html`
        <article id="profile">
            ${header()}
            <section class="grid gap-1">
                <h2>Create profile</h2>
                <sm-form>
                    <sm-input placeholder="Name" maxlength="30" required></sm-input>
                    <sm-input placeholder="Email" type="email" maxlength="40" required></sm-input>
                    <sm-input placeholder="WhatsApp number" type="tel" maxlength="10" required></sm-input>
                    <sm-input placeholder="College" maxlength="50" required></sm-input>
                    <sm-input placeholder="Course" maxlength="30" required></sm-input>
                    <button class="button button--primary" type="submit">Create</button>
                </sm-form>
            </section>   
        </article>
    `)
})

router.addRoute('404', async () => {
    renderElem(getRef('app_body'), html`
        <article class="flex flex-direction-column align-center justify-center gap-1">
            <h1>404</h1>
            <h4>Page not found</h4>
        </article>
    `);
})

let privKeyResolver = null
function getSignedIn(passwordType) {
    return new Promise((resolve, reject) => {
        privKeyResolver = resolve
        try {
            getPromptInput('Enter password', '', {
                isPassword: true,
            }).then(password => {
                if (password) {
                    resolve(password)
                }
            })
        } catch (err) {
            floGlobals.isPrivKeySecured = passwordType === 'PIN/Password';
            if (!['#/landing', '#/sign_in', '#/sign_up'].some(route => window.location.hash.includes(route))) {
                history.replaceState(null, null, '#/landing')
                router.routeTo('#/landing')
            }
        }
    });
}
function setSecurePassword() {
    if (!floGlobals.isPrivKeySecured) {
        const password = getRef('secure_pwd_input').value.trim();
        floDapps.securePrivKey(password).then(() => {
            floGlobals.isPrivKeySecured = true;
            notify('Password set successfully', 'success');
            closePopup();
        }).catch(err => {
            notify(err, 'error');
        })
    }
}
function signOut() {
    getConfirmation('Sign out?', { message: 'You are about to sign out of the app, continue?', confirmText: 'Leave', cancelText: 'Stay' })
        .then(async (res) => {
            if (res) {
                await floDapps.clearCredentials();
                location.reload();
            }
        });
}
const btcAddresses = {}
const floAddresses = {}
function getBtcAddress(floAddress) {
    if (!btcAddresses[floAddress])
        btcAddresses[floAddress] = btcOperator.convert.legacy2bech(floAddress)
    return btcAddresses[floAddress]
}
function getFloAddress(btcAddress) {
    if (!floAddresses[btcAddress])
        floAddresses[btcAddress] = floCrypto.toFloID(btcAddress)
    return floAddresses[btcAddress]
}
router.routeTo('loading')
window.addEventListener("load", () => {
    const [browserName, browserVersion] = detectBrowser().split(' ');
    const supportedVersions = {
        Chrome: 85,
        Firefox: 75,
        Safari: 13,
    }
    if (browserName in supportedVersions) {
        if (parseInt(browserVersion) < supportedVersions[browserName]) {
            notify(`${browserName} ${browserVersion} is not fully supported, some features may not work properly. Please update to ${supportedVersions[browserName]} or higher.`, 'error')
        }
    } else {
        notify('Browser is not fully compatible, some features may not work. for best experience please use Chrome, Edge, Firefox or Safari', 'error')
    }
    document.body.classList.remove('hidden')
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
            closePopup()
        }
    })
    document.addEventListener('copy', () => {
        notify('copied', 'success')
    })
    document.addEventListener("pointerdown", (e) => {
        if (e.target.closest("button:not(:disabled), .interactive:not(:disabled)")) {
            createRipple(e, e.target.closest("button, .interactive"));
        }
    });
    floDapps.setMidStartup(() =>
        new Promise((resolve, reject) => {
            floCloudAPI.requestObjectData('rmInterns').then(() => {
                if (['#/landing', '#/sign_in', '#/sign_up'].some(route => window.location.hash.includes(route))) {
                    router.routeTo(window.location.hash);
                }
                resolve()
            }).catch(err => {
                console.error(err)
                reject()
            })
        })
    )
    floDapps.setCustomPrivKeyInput(getSignedIn)

    floDapps.launchStartUp().then(async result => {
        console.log(result)
        floGlobals.isUserLoggedIn = true
        floGlobals.myFloID = getFloAddress(floDapps.user.id);
        floGlobals.myBtcID = getBtcAddress(floGlobals.myFloID)
        floGlobals.isSubAdmin = floGlobals.subAdmins.includes(floGlobals.myFloID)
        floGlobals.isAdmin = floGlobals.myFloID === floGlobals.adminID
        try {
            if (floGlobals.isSubAdmin) {
                const promises = []
                // initialize intern app data structure
                if (!floGlobals.appObjects.rmInterns) {
                    console.log('rmInterns not found, resetting')
                    floGlobals.appObjects.rmInterns = {
                        tasks: [],
                    }
                    promises.push(floCloudAPI.resetObjectData('rmInterns'))
                }
                promises.push(floCloudAPI.requestGeneralData('taskApplications'))
                await Promise.all(promises)
            } else if (floGlobals.isAdmin) {

            } else {
                // fetch user's kyc requests
                await floCloudAPI.requestGeneralData('taskApplications', {
                    senderID: [floGlobals.myFloID, floGlobals.myBtcID],
                })
            }
            if (['#/landing', '#/sign_in', '#/sign_up'].includes(window.location.hash)) {
                history.replaceState(null, null, '#/home')
                router.routeTo('home')
            } else {
                router.routeTo(window.location.hash)
            }
        } catch (err) {
            console.error(err)
        }
    }).catch(error => console.error(error))
});