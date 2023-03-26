// @ts-check
/** row for `ccf-2022-en.csv` */
declare interface CsvDataEnRow {
    /** #no */
    n: string
    /** abbreviation */
    a: string
    /** name */
    name: string
    /** publisher */
    pub: string
    /**  URL */
    url: string
    /** tier, CCF-A/B/C */
    i: 0 | 1 | 2
    /** 0=conference 1=journal */
    t: 0 | 1
    /** topics */
    tp: string
}

/** row for `ccf-2022-cn.csv` */
declare interface CsvDataCnRow {
    /** #no */
    n: string
    /** name */
    name: string
    /** CN code */
    c: string
    /** publisher */
    pub: string
    /** language, 0=chinese 1=english 2=cn+en */
    l: 0 | 1 | 2
    /** tier, CCF-T1/T2/T3 */
    i: 1 | 2 | 3
}

declare interface CcfItem {
    title: string
    description: string
    url: string
    searchKey: string
}

/** typedef for uTools preload.js */
namespace Preload {
    type Action = {
        code: string
        type: string
        payload: any
    }

    type Item = {
        title: string
        description?: string
        icon?: string
        [index: string]: any
    }

    type SetListCb = (items: Item[] | null) => void

    type ListEnter = (action: Action, callbackSetList: SetListCb) => void

    type ListSearch = (action: Action, searchWord: string, callbackSetList: SetListCb) => void

    type ListSelect = (action: Action, itemData: Item, callbackSetList: SetListCb) => void

    interface ListFullArgs {
        /** placeholder string of searching box @default "搜索" */
        placeholder: string
        /** Enter feature */
        enter: ListEnter
        /** Search input changes */
        search: ListSearch
        /** Select an item */
        select: ListSelect
    }

    /** args when feature.mode="list" */
    export type ListArgs = Partial<ListFullArgs>
}