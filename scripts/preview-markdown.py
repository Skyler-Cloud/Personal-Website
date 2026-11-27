import sys
import mistune
# Offline preview only. Production uses markdown-it and KaTeX.
md = mistune.create_markdown(escape=True, plugins=['table','strikethrough','math'])
print(md(sys.stdin.read()),end='')
