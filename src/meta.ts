export const fetchDocsMeta = (docs:string[])=>{
  if(!docs.length) {
    return []
  }
  return Promise.allSettled(docs.map(doc=>{
    return fetch(`https://deno.land/x/deno_doc/fs_module/${doc}.ts.md`)
      .then(res=>res.text())
      .then(text=>({
        name: doc,
        text
      }))
  }))
}