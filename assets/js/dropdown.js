/*
 * Replaces the native <select> popup — which the OS renders and CSS cannot
 * reach — with a button + listbox styled to match the rest of the page.
 *
 * The original <select> stays in the DOM and remains the source of truth: the
 * chart scripts keep reading `select.value`, and both `input` and `change` are
 * dispatched on selection (the plots listen for one or the other). If this
 * script never runs, the native control is untouched and still works.
 */

let idCounter = 0;

function enhance(select) {
    const wrap = select.closest('.select-wrap');
    if (!wrap || wrap.classList.contains('is-enhanced')) return;

    const baseId = select.id || `select-${++idCounter}`;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'select-trigger';
    trigger.id = `${baseId}-trigger`;
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const menu = document.createElement('ul');
    menu.className = 'select-menu';
    menu.id = `${baseId}-menu`;
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;

    // Mirror the label of whichever control labels the select
    const labelEl = document.querySelector(`label[for="${select.id}"]`);
    if (labelEl) trigger.setAttribute('aria-labelledby', `${labelEl.id || (labelEl.id = `${baseId}-label`)} ${trigger.id}`);

    const options = Array.from(select.options).map((option, index) => {
        const item = document.createElement('li');
        item.className = 'select-option';
        item.id = `${baseId}-option-${index}`;
        item.setAttribute('role', 'option');
        item.textContent = option.textContent;
        item.dataset.index = String(index);
        item.addEventListener('click', () => {
            commit(index);
            close(true);
        });
        item.addEventListener('mousemove', () => setActive(index));
        menu.appendChild(item);
        return item;
    });

    let activeIndex = select.selectedIndex;
    let isOpen = false;

    function syncTrigger() {
        const selected = select.options[select.selectedIndex];
        trigger.textContent = selected ? selected.textContent : '';
        options.forEach((item, i) =>
            item.setAttribute('aria-selected', String(i === select.selectedIndex)));
    }

    function setActive(index) {
        activeIndex = Math.max(0, Math.min(index, options.length - 1));
        options.forEach((item, i) => item.classList.toggle('is-active', i === activeIndex));
        const active = options[activeIndex];
        if (active) {
            menu.setAttribute('aria-activedescendant', active.id);
            if (isOpen) active.scrollIntoView({ block: 'nearest' });
        }
    }

    function commit(index) {
        if (index === select.selectedIndex) return;
        select.selectedIndex = index;
        syncTrigger();
        // The plots listen for one or the other, so fire both.
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function open() {
        if (isOpen) return;
        isOpen = true;
        menu.hidden = false;
        wrap.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        setActive(select.selectedIndex);
    }

    function close(refocus) {
        if (!isOpen) return;
        isOpen = false;
        menu.hidden = true;
        wrap.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        if (refocus) trigger.focus();
    }

    trigger.addEventListener('click', () => (isOpen ? close(false) : open()));

    trigger.addEventListener('keydown', event => {
        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowUp':
            case 'Enter':
            case ' ':
                event.preventDefault();
                open();
                break;
            default:
        }
    });

    wrap.addEventListener('keydown', event => {
        if (!isOpen) return;
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setActive(activeIndex + 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                setActive(activeIndex - 1);
                break;
            case 'Home':
                event.preventDefault();
                setActive(0);
                break;
            case 'End':
                event.preventDefault();
                setActive(options.length - 1);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                commit(activeIndex);
                close(true);
                break;
            case 'Escape':
                event.preventDefault();
                close(true);
                break;
            case 'Tab':
                close(false);
                break;
            default:
        }
    });

    document.addEventListener('click', event => {
        if (isOpen && !wrap.contains(event.target)) close(false);
    });

    // Keep the label in step if anything changes the select programmatically
    select.addEventListener('change', syncTrigger);

    wrap.append(trigger, menu);
    wrap.classList.add('is-enhanced');
    syncTrigger();
}

function init() {
    document.querySelectorAll('.select-wrap > select').forEach(enhance);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
