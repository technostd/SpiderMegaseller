def create_user_prompt(review_text: str, product_model: str = None, rating: int = None) -> str:
    """Создает пользовательский промпт для анализа отзыва"""
    prompt_lines = ["Проанализируй этот отзыв и верни результат в JSON формате:"]

    if product_model:
        prompt_lines.append(f"Товар: {product_model}")

    if rating:
        prompt_lines.append(f"Оценка: {rating}/5")

    prompt_lines.append(f"Текст отзыва: {review_text}")

    prompt_lines.append("\nОтвечай только JSON, без пояснений.")

    return "\n".join(prompt_lines)