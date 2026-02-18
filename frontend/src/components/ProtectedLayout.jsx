import React from 'react'

export default function ProtectedLayout({ children }){
  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <header style={{padding:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontWeight:700,fontSize:18,color:'#fff'}}>FamilyOrg</div>
      </header>
      <main style={{flex:1}}>{children}</main>
      <footer style={{padding:12,textAlign:'center',color:'#fff'}}>© FamilyOrg</footer>
    </div>
  )
}
