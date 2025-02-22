import { traverseHtmlElements } from "@udecode/plate-common";

// TODO: move to plate
const ALLOWED_EMPTY_ELEMENTS = ["BR", "IMG", "TH", "TD"];

const isEmpty = (element: Element): boolean => {
    return (
        !ALLOWED_EMPTY_ELEMENTS.includes(element.nodeName) &&
        !element.innerHTML.trim()
    );
};

const removeIfEmpty = (element: Element): void => {
    if (isEmpty(element)) {
        const { parentElement } = element;

        element.remove();

        if (parentElement) {
            removeIfEmpty(parentElement);
        }
    }
};

export const cleanHtmlEmptyElements = (rootNode: Node): void => {
    traverseHtmlElements(rootNode, (element) => {
        removeIfEmpty(element);
        return true;
    });
};
