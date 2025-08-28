// @ts-check

import React, {useEffect, useState} from "react"
import {TreeView} from "@patternfly/react-core"

/**
 * @typedef {Object} procTree
 * @prop {string} name
 * @prop {string} id
 * @prop {{ "aria-label"?: string, checked?: boolean }} checkProps
 * @prop {procTree[]} children?
 * @prop {boolean} defaultExpanded?
 */

/**
 *
 * @param {{procTreeArray: procTree[]}} procTreeArray
 */
export default function ({procTreeArray}) {
    const [checkedItems, setCheckedItems] = useState([])
    //useEffect(() => {
    //    console.log("Checked items: ", checkedItems)
    //}, [checkedItems])

    const onCheck = (event, treeViewItem) => {
        const checked = event.target.checked
        const checkedItemTree = procTreeArray.map(opt => Object.assign({}, opt)).filter(item => filterItems(item, treeViewItem))
        const flatCheckedItems = flattenTree(checkedItemTree)
        setCheckedItems(prevCheckedItems => (checked ? prevCheckedItems.concat(flatCheckedItems.filter(item => !checkedItems.some(i => i.id === item.id))) : prevCheckedItems.filter(item => !flatCheckedItems.some(i => i.id === item.id))))
    }
    const isChecked = dataItem => checkedItems.some(item => item.id === dataItem.id)
    const areAllDescendantsChecked = dataItem => (dataItem.children ? dataItem.children.every(child => areAllDescendantsChecked(child)) : isChecked(dataItem))
    const areSomeDescendantsChecked = dataItem => (dataItem.children ? dataItem.children.some(child => areSomeDescendantsChecked(child)) : isChecked(dataItem))
    const flattenTree = tree => {
        let result = []
        tree.forEach(item => {
            result.push(item)
            if (item.children) {
                result = result.concat(flattenTree(item.children))
            }
        })
        return result
    }
    const mapTree = item => {
        const hasCheck = areAllDescendantsChecked(item)
        if (item.checkProps) {
            item.checkProps.checked = false
            if (hasCheck) {
                item.checkProps.checked = true
            } else {
                const hasPartialCheck = areSomeDescendantsChecked(item)
                if (hasPartialCheck) {
                    item.checkProps.checked = null
                }
            }
            if (item.children) {
                return {
                    ...item,
                    children: item.children.map(child => mapTree(child))
                }
            }
        }
        return item
    }
    const filterItems = (item, checkedItem) => {
        if (item.id === checkedItem.id) {
            return true
        }
        if (item.children) {
            return (item.children = item.children.map(opt => Object.assign({}, opt)).filter(child => filterItems(child, checkedItem))).length > 0
        }
    }
    const mapped = procTreeArray.map(item => mapTree(item))
    return <TreeView hasAnimations aria-label='Tree View with checkboxes example' data={mapped} onCheck={onCheck} hasCheckboxes />
}
