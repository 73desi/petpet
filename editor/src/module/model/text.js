/**
 * @typedef { 'LEFT' | 'CENTER' | 'RIGHT' } TextAlign
 * @typedef { 'NONE' | 'BREAK' | 'ZOOM' } TextWrap
 * @typedef { 'PLAIN' | 'BOLD' | 'ITALIC' } TextStyle
 */

import {fabric} from "fabric"
import {Model} from "./model.js"
import {dom, domCheckbox, domInput, domSelect,createRadioButtonGroup,createInputGroup} from "../util/dom.js"

/**
 * @typedef { object } TextDTO
 * @property { string } text
 * @property { number[2] | number[3] } pos
 * @property { string } color
 * @property { number } size
 * @property { TextAlign } align
 * @property { TextWrap } wrap
 * @property { TextStyle } style
 * @property { string } strokeColor
 * @property { number } strokeSize
 */
let textIndex=0
export class TextModel extends Model {
    /** @type { fabric.IText } */
    text
    /** @type { TextAlign } */
    align = 'LEFT'
    /** @type { TextWrap } */
    wrap = 'NONE'
    /** @type { TextStyle } */
    #style = 'PLAIN'
    /** @type { number | null } */
    #maxWidth = null

    /**
     * @param { fabric.Canvas } canvas
     * @param { string } [text = 'Petpet!']
     */
    constructor(canvas, text = 'Petpet!') {
        super(canvas)

        this.text = new fabric.IText(text, {fill: '#191919', fontSize: 56});
        this.text.setControlsVisibility({
            mb: false,
            ml: false,
            mr: false,
            mt: false,
            mtr: false
        })
        canvas.add(this.text)

        this.text.on('moving', () => this.listener(this))
            .on('scaling', () => this.listener(this))
            .on('changing', () => this.listener(this))
    }

    /** @param { number[2] } pos */
    set pos(pos) {
        let [x, y] = pos
        switch (this.align) {
            case 'RIGHT':
                x -= this.text.getScaledWidth()
                break
            case 'CENTER':
                x -= this.text.getScaledWidth() / 2
                y -= this.text.getScaledHeight() / 2
                break
        }
        this.text.set('left', x).set('top', y)
        this.canvas.renderAll()
    }

    /** @return { number[2] | number[3] } */
    get pos() {
        let x = Math.round(this.text.left)
        let y = Math.round(this.text.top)
        switch (this.align) {
            case 'RIGHT':
                x += Math.round(this.text.getScaledWidth())
                break
            case 'CENTER':
                x += Math.round(this.text.getScaledWidth() / 2)
                y += Math.round(this.text.getScaledHeight() / 2)
                break
        }
        return this.#maxWidth ? [x, y, this.#maxWidth] : [x, y]
    }

    /** @param { TextStyle } style */
    set style(style) {
        let bold = style === 'BOLD'
        let italic = style === 'ITALIC'
        this.text.setSelectionStyles({
            fontWeight: bold ? 'bold' : null,
            fontStyle: italic ? 'italic' : null
        })
        this.#style = style
        this.canvas.renderAll()
    }

    /** @return { TextStyle } */
    get style() {
        return this.#style
    }

    /** @param { number } size Points Size */
    set size(size) {
        this.text.set({
            fontSize: TextModel.toPixelSize(size),
            scaleX: 1,
            scaleY: 1
        })
        this.canvas.renderAll()
    }

    /** @return { number } */
    get size() {
        return TextModel.toPointsSize(this.text.fontSize * this.text.scaleX)
    }

    /** @param { string } color */
    set color(color) {
        this.text.set('fill', color)
        this.canvas.renderAll()
    }

    /** @return { string } */
    get color() {
        return this.text.fill
    }

    /** @param { number | null } size Points Size */
    set strokeSize(size) {
        this.text.set({
            strokeWidth: !size || (size <= 0 ? 1 : size),
            fontSize: TextModel.toPixelSize(this.size),
            scaleX: 1,
            scaleY: 1
        })
        this.canvas.renderAll()
    }

    /** @return { number } */
    get strokeSize() {
        return this.text.strokeWidth
    }

    /** @param { string | null } color */
    set strokeColor(color) {
        this.text.set('stroke', color)
        this.canvas.renderAll()
    }

    /** @return { string } */
    get strokeColor() {
        return this.text.stroke
    }

    /** @param { number | null } size */
    set maxWidth(size) {
        this.#maxWidth = size <= 0 ? null : size
    }

    /** @return { HTMLDivElement } */
    get DOM() {
        const content = dom('div', {
            class: 'form-content'
        })
        const parent = dom('div', {class: "text-form form"})
        const size = domInput('字号', {
            type: 'number',
            placeholder: 'pt',
            value: Math.round(TextModel.toPointsSize(56))
        }, {
            event: 'change',
            fun: e => this.size = e.target.value
        })
        this.text.on('scaling', e => {
            let s = this.text.fontSize * this.text.scaleX
            size.input.value = Math.round(TextModel.toPointsSize(s)).toString()
        })

        const color = domInput('颜色', {
            type: 'color',
            value: '#191919'
        }, {
            event: 'input',
            fun: e => this.color = e.target.value
        })

        const maxWidth = domInput('', {
            type: 'number',
            placeholder: '文本最大宽度',
            value: '',
        }, {
            event: 'change',
            fun: e => this.maxWidth = e.target.value
        })
        maxWidth.setAttribute('disabled','true')
        const fontStyle = createRadioButtonGroup("字体样式",`字体样式${textIndex}`, [
            {key: 'PLAIN', value: '默认',checked:true},
            {key: 'BOLD', value: '粗体'},
            {key: 'ITALIC', value: '斜体'}
        ])
        fontStyle.addEventListener('change',({target})=>{
            this.style=target.value
        })


        const wrap=createRadioButtonGroup('文本溢出',`文本溢出${textIndex}`[
            {key: 'NONE', value: '不换行',checked:true},
            {key: 'BREAK', value: '自动换行'},
            {key: 'ZOOM', value: '自动缩放'}
        ])
        const wrapInputGroup= createInputGroup(wrap)
        wrapInputGroup.appendChild(maxWidth)
        wrap.addEventListener('change',(e)=>{
                    this.wrap = e.target.value
                    if (this.wrap === 'BREAK' || this.wrap === 'ZOOM') {
                        maxWidth.removeAttribute('disabled')
                        this.#maxWidth = maxWidth.input.value
                    } else {
                        maxWidth.setAttribute('disabled','true')
                        maxWidth.input.value=''
                        this.#maxWidth = null
                    }
        })


        const align=createRadioButtonGroup('对齐方式',`对齐方式${textIndex++}`,[
                {key: 'LEFT', value: '左对齐',checked:true},
                {key: 'RIGHT', value: '右对齐'},
                {key: 'CENTER', value: '居中'}
        ])
        align.addEventListener('change',e => {
                    this.align = e.target.value
                })

        const strokeDiv = dom('div', {class: 'text-stroke-input'})
        const strokeWidth = domInput('描边宽度', {
            type: 'number',
            placeholder: 'px',
            value: 0
        }, {
            event: 'input',
            fun: e => {
                if (Number(e.target.value)){
                    if (!this.strokeColor){
                        this.strokeColor='#eeaabb'
                    }
                    this.strokeSize = e.target.value
                }else {
                    this.strokeColor = null
                }

            }
        })
        const strokeColor = domInput('描边颜色', {
            type: 'color',
            value: '#eeaabb'
        }, {
            event: 'input',
            fun: e => {
                if (strokeWidth.input.value){
                    this.strokeColor = e.target.value
                }
            }
        })
        strokeDiv.append(strokeWidth, strokeColor)

        const deleteDom = dom('div', {html: '移除', class: 'remove'}, {
            event: 'click',
            fun: () => this.remove()
        })
        size.classList.add("text-size")
        color.classList.add("text-color")
        content.append(createInputGroup(size, color), createInputGroup(fontStyle, align),
            wrapInputGroup,
            createInputGroup(strokeWidth,strokeColor)
            , createInputGroup(dom('div', {class: 'separate'}), deleteDom))

        parent.append( dom('div',{class:'form-header'}),content)
        this.dom = parent
        return parent
    }

    remove() {
        this.canvas.remove(this.text)
        this.canvas.renderAll()
        this.dom.remove()
        this.removeCallback(this)
    }

    /** @return { TextDTO } */
    get DTO() {
        return {
            text: this.text.text,
            pos: this.pos,
            color: this.color,
            size: Math.round(this.size),
            align: this.align,
            wrap: this.wrap,
            style: this.style,
            strokeColor: this.strokeColor,
            strokeSize: this.strokeSize
        }
    }

    /**
     * @param { number } pixelSize
     * @return { number }
     */
    static toPointsSize(pixelSize) {
        return (72 * pixelSize) / (window.devicePixelRatio * 96) //DPI
    }

    /**
     * @param { number } pointsSize
     * @return { number }
     */
    static toPixelSize(pointsSize) {
        return (pointsSize / 72) * (window.devicePixelRatio * 96) //DPI
    }
}
