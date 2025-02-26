censorred_words = [
    "gay", 
    "öğlen birası", 
    "napıcaz o işleri", 
    "benim iştahım kaçtı",
    "bu dönem her dersten ba alıcam"
]

# longest prefix suffix
def compute_lps_array(pat, M, lps):
    len = 0
    
    lps[0] = 0 
    i = 1
    
    while i < M:
        if pat[i] == pat[len]:
            len += 1
            lps[i] = len
            i += 1
        else:
            if len != 0:
                len = lps[len-1]
            else:
                lps[i] = 0
                i += 1

def kmp_search(pat, txt):
    M = len(pat)
    N = len(txt)
    
    lps = [0]*M
    j = 0
    
    compute_lps_array(pat, M, lps)
    
    i = 0
    result_txt = txt 
    
    while i < N:
        if pat[j] == txt[i].lower():
            i += 1
            j += 1
        
        if j == M:
            start_idx = i - j
            result_txt = result_txt[:start_idx] + ('*' * M) + result_txt[start_idx + M:]
            
            #print("Found pattern at index", str(start_idx))
            j = lps[j-1]
        
        elif i < N and pat[j] != txt[i].lower():
            if j != 0:
                j = lps[j-1]
            else:
                i += 1
    
    return result_txt

def censorship(text):      
    result = text
    for censorred_word in censorred_words:
        print(censorred_word)
        result = kmp_search(censorred_word, result)
    
    return result