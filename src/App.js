import './styles.css'
import * as React from 'react'
import {
  Plate,
  BlockToolbarButton,
  createReactPlugin,
  createHistoryPlugin,
  createPlateComponents,
  createParagraphPlugin,
  createBlockquotePlugin,
  createCodeBlockPlugin,
  createHeadingPlugin,
  createPlateOptions,
  createResetNodePlugin,
  createSoftBreakPlugin,
  createExitBreakPlugin,
  getPlatePluginType,
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_BLOCKQUOTE,
  ELEMENT_TODO_LI,
  ELEMENT_PARAGRAPH,
  ELEMENT_CODE_BLOCK,
  ELEMENT_TD,
  KEYS_HEADING,
  usePlateEditorRef,
  HeadingToolbar,
  isBlockAboveEmpty,
  isSelectionAtBlockStart,
  usePlateEditorState
} from '@udecode/plate'
import slate, { serialize } from 'remark-slate'
import { unified } from 'unified'
import parse from 'remark-parse'
import remarkGfm from 'remark-gfm'

const id = 'editor'

const EditorState = React.createContext()

const StateProvider = ({ children }) => {
  const s = usePlateEditorState(id)
  const append = React.useCallback(
    (...data) => {
      data.forEach((node) => s.insertNode(node))
    },
    [s]
  )

  return (
    <EditorState.Provider value={{ append }}>{children}</EditorState.Provider>
  )
}

const useEditorState = () => {
  return React.useContext(EditorState)
}

const resetBlockTypesCommonRule = {
  types: [ELEMENT_BLOCKQUOTE, ELEMENT_TODO_LI],
  defaultType: ELEMENT_PARAGRAPH
}

const CONFIG = {
  options: createPlateOptions(),
  components: createPlateComponents(),
  resetBlockType: {
    rules: [
      {
        ...resetBlockTypesCommonRule,
        hotkey: 'Enter',
        predicate: isBlockAboveEmpty
      },
      {
        ...resetBlockTypesCommonRule,
        hotkey: 'Backspace',
        predicate: isSelectionAtBlockStart
      }
    ]
  },
  softBreak: {
    rules: [
      { hotkey: 'shift+enter' },
      {
        hotkey: 'enter',
        query: {
          allow: [ELEMENT_CODE_BLOCK, ELEMENT_BLOCKQUOTE, ELEMENT_TD]
        }
      }
    ]
  },
  exitBreak: {
    rules: [
      {
        hotkey: 'mod+enter'
      },
      {
        hotkey: 'mod+shift+enter',
        before: true
      },
      {
        hotkey: 'enter',
        query: {
          start: true,
          end: true,
          allow: KEYS_HEADING
        }
      }
    ]
  }
}

const PLUGINS = [
  createReactPlugin(),
  createHistoryPlugin(),
  createParagraphPlugin(), // paragraph element
  createBlockquotePlugin(), // blockquote element
  createCodeBlockPlugin(), // code block element
  createHeadingPlugin(), // heading elements
  createResetNodePlugin(CONFIG.resetBlockType),
  createSoftBreakPlugin(CONFIG.softBreak),
  createExitBreakPlugin(CONFIG.exitBreak)
]

const Toolbar = () => {
  const editor = usePlateEditorRef()

  return (
    <HeadingToolbar>
      <BlockToolbarButton
        type={getPlatePluginType(editor, ELEMENT_H1)}
        icon={<>H1</>}
      />
      <BlockToolbarButton
        type={getPlatePluginType(editor, ELEMENT_H2)}
        icon={<>H2</>}
      />
    </HeadingToolbar>
  )
}

const initial = `
  # Initial

  Hello

  > asd
`

const options = {
  nodeTypes: {
    paragraph: 'p',
    block_quote: 'blockquote',
    code_block: 'code_block',
    link: 'a',
    ul_list: 'ul',
    ol_list: 'ol',
    listItem: 'li',
    heading: {
      1: 'h1',
      2: 'h2',
      3: 'h3',
      4: 'h4',
      5: 'h5',
      6: 'h6'
    },
    emphasis_mark: 'em',
    strong_mark: 'bold',
    delete_mark: 'strikethrough',
    inline_code_mark: 'code',
    thematic_break: 'thematic_break',
    image: 'img'
  }
}

let initialState
unified()
  .use(parse)
  .use(remarkGfm)
  .use(slate, options)
  .process(initial, (_, nodes) => {
    initialState = nodes.result
  })
console.log(initialState)
console.log(CONFIG.options)
console.log(CONFIG.components)
console.log(ELEMENT_H1)

const Editor = () => {
  const [value, set] = React.useState([])
  return (
    <>
      <section className="editor container">
        <Toolbar />
        <Plate
          id={id}
          initialValue={initialState}
          onChange={(v) => set(v)}
          editableProps={{ placeholder: 'Type...' }}
          plugins={PLUGINS}
          options={CONFIG.options}
          components={CONFIG.components}
        />
      </section>
      <aside className="formatted-content container">
        <div>
          <h3>Markdown</h3>
          <div style={{ whiteSpace: 'pre' }}>
            {value.map((node) => serialize(node, options)).join('\n')}
          </div>
        </div>
        <div>
          <h3>Slate Object</h3>
          <pre>
            <code>{JSON.stringify(value, null, 2)}</code>
          </pre>
        </div>
      </aside>
    </>
  )
}

const RandomData = () => {
  const { append } = useEditorState()
  return (
    <div className="footer container">
      <button
        onClick={() => append({ children: [{ text: 'Hello' }], type: 'p' })}
      >
        paragraph
      </button>
      <button
        onClick={() => append({ children: [{ text: 'Hello' }], type: 'h1' })}
      >
        heading
      </button>
      <button
        onClick={() =>
          append(
            { children: [{ text: 'Hello' }], type: 'h1' },
            { children: [{ text: 'Hello' }], type: 'p' }
          )
        }
      >
        article
      </button>
    </div>
  )
}

export default function App() {
  return (
    <StateProvider>
      <Editor />
      <RandomData />
    </StateProvider>
  )
}
