// @ts-check
/* eslint-disable react/jsx-no-bind */

import React, {useEffect, useState} from "react"
import {TreeView} from "@patternfly/react-core"
import PropTypes from "prop-types"

/**
 * @typedef {Object} procTree
 * @prop {string} name
 * @prop {string} id
 * @prop {{"aria-label"?: string, checked?: boolean}} checkProps
 * @prop {procTree[]} [children]
 * @prop {boolean} [defaultExpanded]
 */

/**
 *
 * @param {{
 *     procTreeArray: procTree[],
 *     onNewSelect?: (checkedItems?: Set<number>) => void
 * }} props
 */
export default function ItemExplorer({procTreeArray, onNewSelect = () => {}}) {
    const [checkedItems, setCheckedItems] = useState(/** @type {Set<number>} */ (new Set))
    useEffect(
        () => {
            onNewSelect(checkedItems)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [checkedItems]
    )

    /**
     * @param {React.ChangeEvent} event
     * @param {import('@patternfly/react-core').TreeViewDataItem} treeViewItem
     */
    function onCheck(event, treeViewItem) {
        const newCheckedItems = new Set(checkedItems)

        if (/** @type {HTMLInputElement} */ (event.target).checked)
            newCheckedItems.add(+treeViewItem.id.split('=')[1])
        else
            newCheckedItems.delete(+treeViewItem.id.split('=')[1])

        setCheckedItems(newCheckedItems)
    }

    /**
     * @param {procTree[]} procTreeArray
     * @returns {procTree[]}
     */
    function markChecked(procTreeArray) {
        // @ts-ignore
        return procTreeArray.map(
            item => (
                {
                    ...item,
                    checkProps: {
                        ...item.checkProps,
                        checked: checkedItems.has(+item.id.split('=')[1])
                    },
                    children: item.children ? markChecked(item.children) : undefined
                }
            )
        )
    }

    return (
        <TreeView
            hasAnimations
            aria-label='Tree View with checkboxes example'
            data={markChecked(procTreeArray)}
            onCheck={onCheck}
            hasCheckboxes
        />
    )
}

ItemExplorer.propTypes = {
    procTreeArray: PropTypes.array.isRequired,
    onNewSelect: PropTypes.func
}
