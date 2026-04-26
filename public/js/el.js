function el(tag, attrs={}, children=[], listeners={}, ns=null) {
	const res=ns?document.createElementNS(tag, ns):document.createElement(tag);
	for(const key in attrs)res.setAttribute(key, attrs[key]);
	for(const child of children)res.append(child);
	for(const i in listeners)res.addEventListener(i,listeners[i]);
	return res;
}