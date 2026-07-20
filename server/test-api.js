fetch('http://localhost:5000/api/v1/products?specs={"socket":"AM5"}')
  .then(r => r.json())
  .then(d => {
    console.log(`Found ${d.data.items.length} items.`);
    console.log(d.data.items.map(i => i.name));
  });
