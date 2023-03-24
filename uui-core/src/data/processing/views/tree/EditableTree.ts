import { IMap } from "../../../../types";
import { BaseTree } from "./BaseTree";
import { ItemsComparator, ITree, TreeNodeInfo } from "./ITree";

export abstract class EditableTree<TItem, TId> extends BaseTree<TItem, TId> {
    public patch(
        items: TItem[],
        isDeletedProp?: keyof TItem,
        comparator?: ItemsComparator<TItem>,
    ): ITree<TItem, TId> {
        if (!items || items.length === 0) {
            return this;
        }

        const newById = this.cloneMap(this.byId);
        const newByParentId = this.cloneMap(this.byParentId); // shallow clone, still need to copy arrays inside!

        let isPatched = false;
        items.forEach((item) => {
            const id = this.getId(item);
            const existingItem = this.byId.get(id);
            const parentId = this.getParentId(item);

            if (isDeletedProp && item[isDeletedProp]) {
                const children = [...(newByParentId.get(parentId) ?? [])];
                newByParentId.set(parentId, this.deleteFromChildren(id, children));
                newByParentId.delete(id);
                newById.delete(id);
                isPatched = true;
                return;
            }

            if (!existingItem || existingItem !== item) {
                const id = this.getId(item);
                newById.set(id, item);

                const existingItemParentId = existingItem ? this.getParentId(existingItem) : undefined;
                if (!existingItem || parentId != existingItemParentId) {
                    const children = [...(newByParentId.get(parentId) ?? [])];
                    newByParentId.set(
                        parentId,
                        this.patchChildren(children, { existingItem, newItem: item }, comparator, newById),
                    );

                    if (existingItem && existingItemParentId !== parentId) {
                        const prevParentChildren = this.byParentId.get(existingItemParentId) ?? [];
                        newByParentId.set(existingItemParentId, this.deleteFromChildren(id, prevParentChildren));
                    }
                }
                isPatched = true;
            }
        });

        if (!isPatched) {
            return this;
        }

        const newNodeInfoById = this.newMap<TId, TreeNodeInfo>();
        for (let [parentId, ids = []] of newByParentId) {
            const prevNodeInfo = this.nodeInfoById.get(parentId);
            let count = prevNodeInfo?.count;
            if (!prevNodeInfo || count !== undefined && !comparator) {
                const prevIds = this.byParentId.get(parentId) ?? [];
                const delta = ids.length - prevIds.length;
                count = (count ?? 0) + delta;
            }

            // for lazy loaded data, count should be undefined
            // and on patch with new items (not on init) previous configuration should not be overridden
            newNodeInfoById.set(parentId, { count });
        }

        return this.newInstance(this.params, newById, newByParentId, newNodeInfoById);
    }

    public cascadeSelection(
        currentSelection: TId[],
        selectedId: TId,
        isSelected: boolean,
        options: {
            isSelectable: (item: TItem) => boolean,
            cascade: boolean,
        },
    ) {
        let selectedIdsMap = this.newMap<TId, boolean>();
        currentSelection.forEach(id => selectedIdsMap.set(id, true));

        options = { isSelectable: BaseTree.truePredicate, cascade: true, ...options };

        const forEachChildren = (action: (id: TId) => void) => {
            this.forEach((item, id) => {
                if (options.isSelectable(item)) {
                    action(id);
                }
            }, { parentId: selectedId });
        };

        if (isSelected) {
            if (selectedId != null) {
                selectedIdsMap.set(selectedId, true);
            }
            if (options.cascade) {
                // check all children recursively
                forEachChildren(id => selectedIdsMap.set(id, true));

                // check parents if all children is checked
                this.getParentIdsRecursive(selectedId).reverse().forEach(parentId => {
                    const childrenIds = this.getChildrenIdsByParentId(parentId);

                    if (childrenIds && childrenIds.every(childId => selectedIdsMap.has(childId))) {
                        selectedIdsMap.set(parentId, true);
                    }
                });
            }
        } else {
            if (selectedId != null) {
                selectedIdsMap.delete(selectedId);
            }

            if (options.cascade) {
                // uncheck all parents recursively
                this.getParentIdsRecursive(selectedId).forEach(parentId => selectedIdsMap.delete(parentId));
                // uncheck all children recursively
                forEachChildren(id => selectedIdsMap.delete(id));
            }
        }

        const result = [];
        for (const [id, value] of selectedIdsMap) {
            value && result.push(id);
        }

        return result;
    }

    private deleteFromChildren<TId>(id: TId, children: TId[]) {
        const foundIndex = children.findIndex((childId) => childId === id);
        if (foundIndex !== -1) {
            children.splice(foundIndex, 1);
        }

        return children;
    }

    private patchChildren(
        children: TId[] | undefined,
        { existingItem, newItem }: { existingItem: TItem | undefined, newItem: TItem },
        comparator: ItemsComparator<TItem>,
        byId: IMap<TId, TItem>,
    ) {
        const id = this.getId(newItem);
        const parentId = this.getParentId(newItem);
        const prevParentId = existingItem ? this.getParentId(existingItem) : undefined;

        if (!children || children === this.byParentId.get(parentId)) {
            children = children ? [...children] : [];
        }

        if ((!existingItem || (existingItem && parentId !== prevParentId)) && comparator) {
            return this.pasteItemIntoChildrenList(newItem, children, comparator, byId);
        }

        return [...children, id];
    }

    private pasteItemIntoChildrenList(
        item: TItem,
        children: TId[],
        comparator: ItemsComparator<TItem>,
        byId: IMap<TId, TItem>,
    ) {
        const id = this.getId(item);
        if (!children.length) {
            return [id];
        }

        const lessOrEqualPosition = children.findIndex((itemId) => comparator(item, byId.get(itemId), true) <= 0);
        const position = lessOrEqualPosition === -1 ? children.length : lessOrEqualPosition;

        children.splice(position, 0, id);
        return children;
    }
}
