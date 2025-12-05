  import ItemCard from "./ItemCard";

  export default function ItemGrid({ items = [] }) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((item, index) => (
          <ItemCard
            key={item.product_id || item.id || index} // ✅ fallback keys
            item={item}
          />
        ))}
      </div>
    );
  }

