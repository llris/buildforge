const categoryRepository = require('../repositories/category.repository');

const getCategoriesTree = async () => {
  const categories = await categoryRepository.findAll();
  
  // Build a tree structure
  const categoryMap = new Map();
  const tree = [];

  // Initialize the map
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Build the tree
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id);
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      tree.push(node);
    }
  });

  return tree;
};

module.exports = {
  getCategoriesTree,
};
