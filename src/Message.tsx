//PascalCasing
function Message(){
    const name = 'Mosh';
    //JSX" JavaScript XML: Gets compiled down to javascript code which can be found one to one through babeljs.io/repl to write jsw code to get converted to javascript
    if(name)
        return <h1>Hello {name}</h1>        
    return <h1>Hello World</h1>
}

export default Message;