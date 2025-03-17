from app.utils.censorship.kmp_algorithm import kmp_search

censorred_words = [
    "gay", 
    "öğlen birası", 
    "napıcaz o işleri", 
    "benim iştahım kaçtı",
    "bu dönem her dersten ba alıcam"
]

def censorship_text(text):      
    result = text
    for censorred_word in censorred_words:
        print(censorred_word)
        result = kmp_search(censorred_word, result)
    
    return result