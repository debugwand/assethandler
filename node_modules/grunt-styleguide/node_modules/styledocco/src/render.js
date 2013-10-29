
      var newBlock = {
        code: block.code,
        docs: block.docs.reduce(function(tokens, token) {
          if (token.type === 'code' && (token.lang == null || token.lang === 'html')) {
            token.type = 'html';
            token.pre = true;
            token.text = '<textarea class="preview-code" spellcheck="false">' + htmlEntities(token.text) + '</textarea>';
          // Add permalink `id`s and some custom properties to headings.
          } else if (token.type === 'heading') {
            var slug = slugify(token.text);
            token.type = 'html';
            token._slug = slug;
            token._origText = token.text;
            // This token should start a new doc section
            if (token.depth === 1) token._split = true;
            token.text = '<h' + token.depth + ' id="' + slug + '">' +
                         token.text + '</h' + token.depth + '>\n';
          }
          tokens.push(token);
          return tokens;
        }, [])
      };
      // Keep marked's custom links property on the docs array.
      newBlock.docs.links = block.docs.links;
      return newBlock;
